import { SignJWT, jwtVerify } from 'jose'

const SECRET = process.env.JWT_SECRET || 'dev-secret'

function secretKey() {
  return new TextEncoder().encode(SECRET)
}

export async function signAccessToken({ userId, loginId, role }) {
  return await new SignJWT({
    userId,
    loginId,
    role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secretKey())
}

// 검증
export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, secretKey())
  return payload
}
