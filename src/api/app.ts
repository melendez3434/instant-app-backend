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
// import { exec } from 'child_process'
import { startCron } from './utils/cron'
// import { intercomClient } from './utils/intercom'
// import { Operators } from 'intercom-client'

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

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  // apollo.installSubscriptionHandlers(app)
  express.set('port', process.env.PORT || 4000)
  const app = httpServer.listen(express.get('port'), async () => {
    // const users = await prisma.user.findMany({
    //   // where: { email: 'ioanagaskins@gmail.com' },
    //   // data: {
    //   //   stripeCustomerId: null,
    //   // },
    //   select: {
    //     email: true,
    //     builderDomain: true,
    //     builder: { select: { companyName: true } },
    //     id: true,
    //   },
    // })

    // for (const user of users) {
    //   await sleep(500)

    //   try {
    //     const contact = await intercomClient.contacts.search({
    //       data: {
    //         query: {
    //           field: 'external_id',
    //           operator: Operators.EQUALS,
    //           value: user.id.toString(),
    //         },
    //       },
    //     })
    //     console.log('🚀 ~ file: app.ts:222 ~ app ~ contact:', contact)

    //     const response = await intercomClient.contacts.update({
    //       // email: user?.email,
    //       id: contact.data[0].id,
    //       customAttributes: {
    //         // domain: user.builderDomain,
    //         businessName: user.builder?.companyName,
    //       },
    //     })
    //     console.log(
    //       '🚀 ~ file: app.ts:218 ~ users.forEach ~ response:',
    //       response,
    //     )
    //   } catch (error) {
    //     console.log('🚀 ~ file: app.ts:219 ~ users.forEach ~ error:', error)
    //   }
    // }
    // const build = await prisma.appBuild.findMany({
    //   where: { id: 52 },
    //   include: { App: { include: { owner: { include: { builder: true } } } } },
    //   orderBy: { id: 'desc' },
    //   take: 1,
    // })
    // console.log(
    //   '🚀 ~ file: app.ts:206 ~ app ~ build:',
    //   JSON.stringify(build, undefined, 2),
    // )
    // console.log('🚀 ~ file: app.ts:247 ~ app ~ users:', users[0].App[0])

    // const app = await prisma.user.findMany({
    //   where: { id: 24 },
    // })
    // console.log('🚀 ~ file: app.ts:194 ~ app ~ app:', app)
    // const apps = await prisma.appBuild.findMany({
    //   where: { status: 'failed' },
    //   include: { App: { include: { owner: { include: { builder: true } } } } },
    //   orderBy: { id: 'desc' },
    //   take: 1,
    // })
    // console.log(
    //   '🚀 ~ file: app.ts:197 ~ app ~ apps:',
    //   JSON.stringify(apps, undefined, 2),
    // )
    // const app = await prisma.app.findUnique({ where: { id: 27 } })
    // console.log('🚀 ~ file: app.ts:204 ~ app ~ app', app)
    // await prisma.builder.updateMany({
    //   where: { ownerId: 1 },
    //   data: { domain: 'test.instantappnow.dev' },
    // })
    // await prisma.user.delete({
    //   where: { id: 3 },
    // })
    // Promise.allSettled(
    //   users.map(async ({ id, builderMine, email }) => {
    //     try {
    //       await await prisma.user.deleteMany({
    //         where: {
    //           role: 'user',
    //           builderDomain: builderMine?.domain,
    //           email: { equals: email, mode: 'insensitive' },
    //         },
    //       })
    //     } catch (error) {}

    //     await await prisma.user.update({
    //       where: { id },
    //       data: { builderDomain: builderMine?.domain },
    //     })
    //   }),
    // )
    // console.log('🚀 ~ file: app.ts ~ line 192 ~ app ~ users', users)
    startCron()

    // const notifications = await prisma.notificationToken.findMany({
    //   where: { appid: 27 },
    //   orderBy: { id: 'desc' },
    //   include: {
    //     user: true,
    //   },
    // })

    // const notificationsa = await prisma.notificationToken.deleteMany({
    //   where: {
    //     id: {
    //       in: [196, 187],
    //     },
    //   },
    // })
    // console.log('🚀 ~ file: app.ts:311 ~ app ~ notificationsa:', notificationsa)
    // console.log('🚀 ~ file: app.ts:300 ~ app ~ notifications:', notifications)

    // console.log(
    //   '🚀 ~ file: app.ts ~ line 192 ~ app ~ users',
    //   await prisma.builder.findMany({
    //     where: { domain: { contains: 'coach.instantappnow.com' } },
    //     include: { owner: true },
    //   }),
    // )
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
