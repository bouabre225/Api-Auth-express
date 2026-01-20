import prisma from "#lib/prisma";
import crypto from "node:crypto";
import { mailer } from "#lib/mailer";
import { hashPassword, verifyPassword } from "#lib/password";
import { signAccessToken, signRefreshToken, verifyToken } from "#lib/jwt";
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from "#lib/exceptions";

function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export class AuthService {
  static async register({ email, password, firstName, lastName }) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException("Resource already exists");

    const hashed = await hashPassword(password);

    const { user, token } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashed, firstName, lastName },
      });

      const token = crypto.randomUUID();

      await tx.verificationToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: addDays(new Date(), 2), // 48h
        },
      });

      return { user, token };
    });

    await mailer.sendVerification(user.email, token);
  }

  static async verifyEmail(token) {
    if (!token || typeof token !== "string") {
      throw new BadRequestException("Missing token");
    }

    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record) throw new BadRequestException("Invalid token");
    if (record.expiresAt < new Date()) {
      throw new BadRequestException("Token expired");
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      });

      await tx.verificationToken.delete({ where: { token } });
    });
  }

  static async login({ email, password }, ipAddress, userAgent) {
    const user = await prisma.user.findUnique({ where: { email } });

    const ok = user && (await verifyPassword(user.password, password));
    await prisma.loginHistory.create({
      data: {
        userId: user?.id ?? "00000000-0000-0000-0000-000000000000",
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        success: Boolean(ok),
      },
    }).catch(() => { /* si userId dummy casse une contrainte, ignore */ });

    if (!user || !ok) throw new UnauthorizedException("Invalid credentials");
    if (user.disabledAt) throw new UnauthorizedException("Account disabled");

    // Option: forcer email vérifié avant login
    // if (!user.emailVerifiedAt) throw new UnauthorizedException("Email not verified");

    const accessToken = await signAccessToken({ userId: user.id });
    const refreshToken = await signRefreshToken({ userId: user.id });

    // on stocke le refresh en DB avec expiry (30 jours)
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt: addDays(new Date(), 30),
      },
    });

    return { accessToken, refreshToken };
  }

  static async refresh(refreshToken) {
    if (!refreshToken) throw new BadRequestException("Missing refreshToken");

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored) throw new UnauthorizedException("Invalid refresh token");
    if (stored.revokedAt) throw new UnauthorizedException("Refresh token revoked");
    if (stored.expiresAt < new Date()) throw new UnauthorizedException("Refresh token expired");

    // Optionnel : vérifier signature JWT aussi
    await verifyToken(refreshToken).catch(() => {
      throw new UnauthorizedException("Invalid refresh token");
    });

    const accessToken = await signAccessToken({ userId: stored.userId });
    return { accessToken };
  }

  static async logout(refreshToken) {
    if (!refreshToken) throw new BadRequestException("Missing refreshToken");

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored) return; // logout idempotent

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  static async logoutAll(userId) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  static async issueTokens(userId, ipAddress, userAgent) {
    const accessToken = await signAccessToken({ userId });
    const refreshToken = await signRefreshToken({ userId });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt: addDays(new Date(), 30),
      },
    });

    // login history (success true)
    await prisma.loginHistory.create({
      data: {
        userId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        success: true,
      },
    });

    return { accessToken, refreshToken };
  }

  static async forgotPassword(email) {
    if (!email) throw new BadRequestException("Email is required");

    // Vérifie si l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Ne pas révéler que l'email n'existe pas
      return;
    }

    // Crée un token unique pour le reset
    const token = crypto.randomUUID();
    const expiresAt = addDays(new Date(), 1); // valable 24h

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    if (process.env.MAIL_HOST) {
      await mailer.sendResetPassword(user.email, token);
    } else {
      // En dev, on log le lien
      console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    }
  }

  static async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      throw new BadRequestException("Token and new password are required");
    }

    // Cherche le token et vérifie expiration
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record) throw new BadRequestException("Invalid token");
    if (record.expiresAt < new Date()) throw new BadRequestException("Token expired");

    // Hash le nouveau mot de passe
    const hashed = await hashPassword(newPassword);

    // Update user et supprime le token
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      });

      await tx.passwordResetToken.delete({ where: { token } });
    });
  }

  /*static async login({ email, password }, ipAddress, userAgent) {
    const user = await prisma.user.findUnique({ where: { email } });
    const ok = user && (await verifyPassword(user.password, password));

    if (!user || !ok) {
      // si tu veux logger aussi les échecs, ton schema LoginHistory oblige userId => compliqué.
      throw new UnauthorizedException("Invalid credentials");
    }
    if (user.disabledAt) throw new UnauthorizedException("Account disabled");

    return this.issueTokens(user.id, ipAddress, userAgent);
  }*/
}