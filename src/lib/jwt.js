import { SignJWT, jwtVerify } from "jose";

const alg = "HS256";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("Missing env JWT_SECRET");
  return new TextEncoder().encode(s);
}

export async function signAccessToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret());
}

export async function signRefreshToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret());
  return payload;
}