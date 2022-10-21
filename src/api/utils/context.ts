import { Auth } from './auth'
// import { log } from './logger'
import { PrismaClient, User } from '@prisma/client'
import { Request } from 'express'

export type Context = {
  auth: Auth
  user: User
  db: PrismaClient
  prisma: PrismaClient
  req: Request
}
