import { Auth } from './auth'
// import { log } from './logger'

import { PrismaClient } from '@prisma/client'
import { Response } from 'express'

export const prisma = new PrismaClient({
  log: ['error'],
  errorFormat: 'pretty',
})
// const pubsub = new PubSub()

export const createContext = async ({
  req,
  res,
  connection,
}: {
  req?: any
  res?: Response
  connection: any
}) => {
  if (connection) {
    const auth = new Auth({
      req: {
        ...connection?.context,
        cookies: {},
        headers: { ...connection?.context?.headers },
      },
      res: connection?.context,
    })
    // console.log('🚀 ~ file: createContext.ts ~ line 50 ~ auth', auth)
    const user = await auth.authenticate()
    // console.log('🚀 ~ file: createContext.ts ~ line 52 ~ user', user)
    // check connection for metadata
    return {
      auth,
      user,
      db: prisma,
      prisma,
      req,
    }
    // return connection.context
  }

  // if (adminDomains.includes(parser.hostname)){}
  const auth = new Auth({
    req,
    res,
  })
  const user = await auth.authenticate()

  const ctx = {
    auth,
    user,
    db: prisma,
    prisma,
    req,
  }

  return ctx
}
