import { Auth } from './auth'
// import { log } from './logger'

import { PrismaClient } from '@prisma/client'
import { Response } from 'express'
import { URL } from 'url'

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
  const parser = req?.get('origin') && new URL(req?.get('origin'))
  console.log('🚀 ~ file: createContext.ts ~ line 53 ~ parser', parser)

  const host =
    req?.get('builderDomain') &&
    !req?.get('builderDomain')?.includes('localhost')
      ? req?.get('builderDomain')
      : process.env.NODE_ENV == 'development' || parser?.hostname == 'localhost'
      ? `demo.brand.com`
      : parser?.hostname
  console.log(
    '🚀 ~ file: createContext.ts ~ line 57 ~ host',
    req?.get('builderDomain'),
  )
  console.log('🚀 ~ file: createContext.ts ~ line 57 ~ host', req.headers)
  console.log(
    '🚀 ~ file: createContext.ts ~ line 57 ~ host',
    req.headers.builderdomain,
  )
  console.log('🚀 ~ file: createContext.ts ~ line 56 ~ host', host)

  const ctx = {
    auth,
    user,
    db: prisma,
    prisma,
    req,
    builderDomain: host || 'noDomain',
  }

  return ctx
}
