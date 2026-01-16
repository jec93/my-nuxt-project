import bcrypt from 'bcryptjs'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, password } = body || {}

  if (!id || !password) {
    throw createError({ statusCode: 400, statusMessage: 'id/password required' })
  }

  // 아이디 중복 체크
  const exists = await prisma.user.findUnique({ where: { loginId: id } })
  if (exists) {
    throw createError({ statusCode: 409, statusMessage: 'loginId already exists' })
  }

  // 비밀번호 해시
  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      loginId: id,
      password: hashed,
      role: 'USER',
    },
    select: { id: true, loginId: true, role: true, createdAt: true },
  })

  return { ok: true, user }
})
