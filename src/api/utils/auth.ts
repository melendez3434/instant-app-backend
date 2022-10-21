/**
 * server/dataSources/Auth.js
 * Auth implementation, it's not really a dataSource so it doesn't need to be here
 */
import { User } from '@prisma/client'
import { authenticate, createJwt } from './passport'

const ONE_MINUTE = 1000 * 60
const ONE_DAY = ONE_MINUTE * 60 * 24
const ONE_MONTH = ONE_DAY * 30
export const cookieConfig =
  process.env.NODE_ENV == 'development'
    ? {
        httpOnly: true,
        expires: new Date(Date.now() + ONE_MONTH),
      }
    : {
        secure: true,
        sameSite: 'None',
        httpOnly: true,
        expires: new Date(Date.now() + ONE_MONTH),
      }

export class Auth {
  isReady: boolean
  hasSignedIn: boolean
  accessTokenName: string
  req: any
  res: any
  payload: any

  constructor({ req, res, host, adminHost }: any) {
    this.req = req
    this.res = res
    this.isReady = false
    this.hasSignedIn = false
    this.accessTokenName = host
  }

  async authenticate(): Promise<User | null> {
    const { req, res } = this

    if (!req.headers.authorization) {
      const cookie = req.cookies[this.accessTokenName]

      if (cookie) req.headers.authorization = `bearer ${cookie}`
    }

    const payload = await authenticate(req, res)

    if (payload) {
      this.payload = payload
      this.hasSignedIn = true
      return payload
    }
    return null
  }

  signInWithJWT(user: any, host?: any) {
    const token = createJwt({
      userId: user.id,
      ...user,
    })

    this.res.cookie(host, token, cookieConfig)

    return token
  }
  setCookie(key: any, value?: any) {
    this.res.cookie(key, value, cookieConfig)
    return true
  }

  logout() {
    // this.res.clearCookie(this.accessTokenName)
    this.res.cookie(this.accessTokenName, '', cookieConfig)
  }
}
