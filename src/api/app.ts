require('make-promises-safe')
import cookieParser from 'cookie-parser'
import doRestRouting from './REST'
import slowDown from 'express-slow-down'
import { ApolloServer } from 'apollo-server-express'
import createExpress from 'express'
import { schema as baseSchema } from './schema'
import { createContext, prisma } from './utils/createContext'

import { permissions } from './shield'
const { applyMiddleware } = require('graphql-middleware')
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import compression from 'compression'
const depthLimit = require('graphql-depth-limit')
const { createComplexityLimitRule } = require('graphql-validation-complexity')

import passport from 'passport'
import { createServer } from 'http'
import { URL } from 'url'
const session = require('express-session')
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} from 'apollo-server-core'
import { exec } from 'child_process'

const schema = applyMiddleware(baseSchema, permissions)
const express = createExpress()
const speedLimiter = slowDown({
  windowMs: 2 * 60 * 1000, // 2 minutes
  delayAfter: 200, // allow 600 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 100:

  // request # 101 is delayed   by  500ms
  // request # 102 is delayed by 1000ms
  // request # 103 is delayed by 1500ms
  // etc.
})

const speedLimiterForStore = slowDown({
  windowMs: 2 * 60 * 1000, // 2 minutes
  delayAfter: 20000, // allow 600 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 100:

  keyGenerator: (req /*, response*/) => {
    const parser = new URL(
      req?.get('origin') || `https://demo.${process.env.DOMAIN}`,
    )
    const host =
      req?.get('shop') ||
      (process.env.NODE_ENV == 'development' || parser.hostname == 'localhost'
        ? `demo.${process.env.DOMAIN}`
        : parser.hostname)

    return host
  },

  // request # 101 is delayed by  500ms
  // request # 102 is delayed by 1000ms
  // request # 103 is delayed by 1500ms
  // etc.
})

var sess = {
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    // maxAge: 24 * 60 * 60 * 365 * 1000,
    maxAge: 10 * 60 * 1000,
  },
}
console.log(
  "🚀 ~ file: app.ts ~ line 117 ~ express.get('env')",
  express.get('env'),
)

if (express.get('env') === 'production') {
  express.enable('trust proxy') // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
  express.set('trust proxy', 2)
  sess.cookie.secure = true // serve secure cookies
}
if (express.get('env') === 'staging') {
  express.enable('trust proxy') // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
  express.set('trust proxy', 1)
  sess.cookie.secure = true // serve secure cookies
}

express.use(cookieParser())
express.use(session(sess))

express.use(speedLimiter)
express.use(speedLimiterForStore)

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 500, // limit each IP to 500 requests per windowMs

  message:
    'Too many requests from this IP, please try again soon, or talk to b7r team',
})
express.use(limiter)
express.use(compression())
express.use(
  helmet({
    contentSecurityPolicy: false,
  }),
)

express.use(passport.initialize())
express.use(passport.session())
// express.use(createExpress.session({ secret: 'SECRET' })); // session secret

doRestRouting(express)
const httpServer = createServer(express)
export const apolloForCommontServer = async (
  { express, httpServer },
  contextApollo,
) => {
  // Hand in the schema we just created and have the
  // WebSocketServer start listening.

  const apollo = new ApolloServer({
    schema,
    ...contextApollo,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
    // plugins: [
    //   {
    //     async serverWillStart() {
    //       return {
    //         async drainServer() {
    //           subscriptionServer.close()
    //         },
    //       }
    //     },
    //   },
    // ],
  })

  console.log(
    '🚀 ~ file: app.ts ~ line 239 ~  apollo.graphqlPath',
    apollo.graphqlPath,
  )

  await apollo.start()

  apollo.applyMiddleware({
    app: express,
    cors: {
      origin: true,
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['POST'],
    },
  })
}
const apolloServer = async () => {
  const contextApollo = {
    context: createContext,
    // playground: process.env.NODE_ENV == 'production' ? undefined : true,
    introspection: process.env.NODE_ENV == 'development' ? true : undefined,
    // introspection: false,
    // playground: false,
    csrfPrevention: true,
    cache: 'bounded',

    validationRules: [
      depthLimit(7),
      createComplexityLimitRule(15000, {
        // onCost: (cost, { _ast: { definitions } }) =>
        //   console.log(
        //     'query cost: ',
        //     cost,
        //     JSON.stringify(definitions, null, 2),
        //   ),
      }),
    ],
  }

  await apolloForCommontServer({ express, httpServer }, contextApollo)

  // apollo.installSubscriptionHandlers(app)
  express.set('port', process.env.PORT || 4000)
  const app = httpServer.listen(express.get('port'), async () => {
    const users = await prisma.user.findMany()

    console.log('🚀 ~ file: app.ts ~ line 192 ~ app ~ users', users)

    console.log('server running at port ' + (process.env.PORT || 4000))
  })

  app.setTimeout(25 * 1000) // 10 * 60 seconds * 1000 msecs = 10 minutes
}
apolloServer()
// var cmd = require('node-cmd')

// cmd.run(
//   `
//   cd ./src/api/
//   sh ./buildApp.sh

//   `,
//   async function (err, data, stderr) {
//     console.log('🚀 ~ file: app.ts ~ line 385 ~ stderr', stderr)
//     console.log('🚀 ~ file: app.ts ~ line 385 ~ err', err)
//     console.log('🚀 ~ file: app.ts ~ line 385 ~ data', data)
//   },
// )
// var nexpect = require('nexpect')

// nexpect
//   .spawn(
//     `
//   npx  expo login -u instantappbuilder -p instantappbuilder

//   npx eas credentials`,
//   )
//   .expect('>')
//   .sendline("console.log('testing')")
//   .expect('testing')
//   .sendline('process.exit()')
//   .run(function (err) {
//     if (!err) {
//       console.log('node process started, console logged, process exited')
//     } else {
//       console.log(err)
//     }
//   })
