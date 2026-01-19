import Prisma from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const { PrismaClient } = Prisma

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}