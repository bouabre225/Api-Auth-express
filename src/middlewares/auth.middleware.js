import prisma from "#lib/prisma";
import { verifyToken } from "#lib/jwt";
import { UnauthorizedException } from "#lib/exceptions";

export const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Unauthorized");
    }

    const token = header.split(" ")[1];

    const blacklisted = await prisma.blacklistedAccessToken.findUnique({
      where: { token },
    });

    if (blacklisted) {
      throw new UnauthorizedException("Token revoked");
    }

    const payload = await verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
};