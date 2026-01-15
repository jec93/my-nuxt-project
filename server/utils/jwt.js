import { SignJWT, jwtVerify } from 'jose'

function secretKey() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is missing in .env')
  return new TextEncoder().encode(secret)
}

export async function signAccessToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secretKey())
}

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, secretKey())
  return payload
}
