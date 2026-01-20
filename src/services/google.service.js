import prisma from "#lib/prisma";
import { OAuth2Client } from "google-auth-library";
import crypto from "node:crypto";
import { hashPassword } from "#lib/password";
import { BadRequestException, UnauthorizedException } from "#lib/exceptions";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  throw new Error("Missing env GOOGLE_CLIENT_ID");
}

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function googleFindOrCreateUser(idToken) {
  // 1) Vérification du token auprès de Google (audience = client id)
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new UnauthorizedException("Invalid Google token");

  const provider = "google";
  const providerId = payload.sub; // unique Google user id
  const email = payload.email;

  if (!email) throw new BadRequestException("Google token missing email");

  // 2) Si déjà lié via OAuthAccount => retourner user
  const existingOAuth = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerId: { provider, providerId },
    },
    include: { user: true },
  });

  if (existingOAuth?.user) {
    // Optionnel : s'assurer que le user n’est pas désactivé
    if (existingOAuth.user.disabledAt) {
      throw new UnauthorizedException("Account disabled");
    }
    return existingOAuth.user;
  }

  // 3) Sinon, on regarde si un user existe déjà avec cet email
  let user = await prisma.user.findUnique({ where: { email } });

  // 4) Créer le user si absent
  // Ton schema impose password String NON NULL, donc on met un hash aléatoire.
  if (!user) {
    const randomPass = crypto.randomBytes(32).toString("hex");
    const hashed = await hashPassword(randomPass);

    user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName: payload.given_name || "",
        lastName: payload.family_name || "",
        emailVerifiedAt: new Date(), // Google email => vérifié
      },
    });
  } else {
    if (user.disabledAt) throw new UnauthorizedException("Account disabled");

    // Si tu veux considérer email comme vérifié si google le confirme
    if (!user.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
    }
  }

  // 5) Créer la liaison OAuthAccount
  await prisma.oAuthAccount.create({
    data: {
      provider,
      providerId,
      userId: user.id,
    },
  });

  return user;
}