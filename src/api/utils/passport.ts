import * as jwt from 'jsonwebtoken'
import passport from 'passport'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { prisma } from './createContext'

const verifyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  audience: 'localhost',
}

passport.use(
  new JwtStrategy(verifyOptions, async function (jwt_payload, done) {
    try {
      if (jwt_payload?.userId) {
        return done(null, jwt_payload)
      } else {
        return done(null, false)
        // or you could create a new account
      }
    } catch (err) {
      if (err) {
        console.log('err', err)
        return done(err, false)
      }
    }
  }),
)
passport.use(
  'digitalJwt',
  new JwtStrategy(verifyOptions, function (jwt_payload, done) {
    return done(null, jwt_payload)
  }),
)
const authenticate = (req: any, res: any): Promise<any | null> => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', async (err, payload, message) => {
      // console.log('message', message)
      try {
        if (err) reject(err)
        if (!payload?.userId) resolve(null)
        const newUser = await prisma.user.findUnique({
          where: { id: payload.userId },
          // where: { id: 7 },
          // email: {
          //   equals: 'info@oakschurch.com',
          //   mode: 'insensitive',
          // },
          select: {
            id: true,
            email: true,
            role: true,
            builderDomain: true,
          },
        })
        const user = { ...payload, ...newUser }
        resolve(user)
      } catch (error) {
        resolve(null)
      }
    })(req, res)
  })
}

// passport.use(
//   new JwtStrategy(verifyOptions, (payload, done) => done(null, payload)),
// )

const createJwt = (payload: any) =>
  jwt.sign(payload, process.env.JWT_SECRET!, {
    algorithm: 'HS256',
    audience: verifyOptions.audience,
    expiresIn: '30 days',
  })

export { createJwt, authenticate }
// export { authenticate }
