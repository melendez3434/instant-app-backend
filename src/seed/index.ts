import { PrismaClient } from '@prisma/client'

export const seed = async () => {
  const prisma = new PrismaClient()

  prisma.$connect()

  prisma.$disconnect()
}
seed().then(() => {
  console.log('all  done')
})
