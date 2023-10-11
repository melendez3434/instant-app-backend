import { createContext, prisma } from '../utils/createContext'
import moment from 'moment'
import * as bcrypt from 'bcryptjs'
import hashPassword from '../utils/hashPassword'
import Stripe from 'stripe'
import axios from 'axios'
import { createSubscription } from '../graphql/types'

const app = require('express')
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
})

const handleSubscription = async (subscription) => {
  const status = subscription.status

  console.log(`Subscription status is ${status}.`)
  if (status == 'active') {
    await prisma.app.update({
      where: {
        id: Number(subscription.metadata.appId),
      },
      data: {
        planStatus: 'sub',
        nextBill: moment.unix(subscription.current_period_end).toDate(),
        paymentAmount:
          subscription.plan?.items?.data[0]?.price?.unit_amount / 100,
        // trialEndDate: new Date(),
        isTrialEnd: true,
      },
    })
  } else if (status == 'trialing') {
    await prisma.app.update({
      where: {
        id: Number(subscription.metadata.appId),
      },
      data: {
        planStatus: 'inTrial',
        trialEndDate: moment.unix(subscription.trial_end).toDate(),
        isTrialEnd: false,
      },
    })
  } else {
    await prisma.app.update({
      where: { id: Number(subscription.metadata.appId) },
      data: {
        planStatus: 'notSub',
        // nextBill: moment.unix(subscription.current_period_end).toDate(),
      },
    })
    // stopped
  }
}

const router = (express) => {
  express.get('/rest', async (req, res) => {
    res.send('welcome again')
  })

  // This is your Stripe CLI webhook secret for testing your endpoint locally.
  // const endpointSecret =
  //   'whsec_af57873fa0e4c9681a2e80822415b4101706b6cd531d6a3bae562cbabc04690d'
  const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET

  const endpointSecretConnect = process.env.STRIPE_ENDPOINT_SECRET_CONNECT

  // const endpointSecret =
  //   'whsec_1d971589026671771d308dd2b4e2b2ca8697ac55d41edbbd700eeef1c107b13e'

  express.post(
    '/rest/stripe/webhook',
    app.raw({ type: 'application/json' }),
    async (request, response) => {
      try {
        let event = request.body
        console.log('🚀 ~ file: index.ts:69 ~ request.body:', request.body)
        // Replace this endpoint secret with your endpoint's unique secret
        // If you are testing with the CLI, find the secret by running 'stripe listen'
        // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
        // at https://dashboard.stripe.com/webhooks
        // Only verify the event if you have an endpoint secret defined.
        // Otherwise use the basic event deserialized with JSON.parse
        console.log('🚀 ~ file: index.ts:27 ~ endpointSecret', endpointSecret)

        if (endpointSecret) {
          // Get the signature sent by Stripe
          const signature = request.headers['stripe-signature']
          console.log('🚀 ~ file: index.ts:30 ~ signature', signature)
          try {
            event = stripe.webhooks.constructEvent(
              request.body,
              signature,
              endpointSecret,
            )
          } catch (err: any) {
            console.log(
              `⚠️  Webhook signature verification failed.`,
              err.message,
            )
            return response.sendStatus(400)
          }
        }
        await handleStripeEvent(event)
        // Return a 200 response to acknowledge receipt of the event
        response.send()
      } catch (error: any) {
        console.log('🚀 ~ file: index.ts:161 ~ error', error)
        response.status(400).send({
          message: error?.message || 'Look At Server Logs!',
        })
      }
    },
  )
  express.post(
    '/rest/stripe/webhook/connect',
    app.raw({ type: 'application/json' }),
    async (request, response) => {
      try {
        let event = request.body
        console.log('🚀 ~ file: index.ts:69 ~ request.body:', request.body)
        // Replace this endpoint secret with your endpoint's unique secret
        // If you are testing with the CLI, find the secret by running 'stripe listen'
        // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
        // at https://dashboard.stripe.com/webhooks
        // Only verify the event if you have an endpoint secret defined.
        // Otherwise use the basic event deserialized with JSON.parse
        console.log(
          '🚀 ~ file: index.ts:27 ~ endpointSecretConnect',
          endpointSecretConnect,
        )

        if (endpointSecretConnect) {
          // Get the signature sent by Stripe
          const signature = request.headers['stripe-signature']
          console.log('🚀 ~ file: index.ts:30 ~ signature', signature)
          try {
            event = stripe.webhooks.constructEvent(
              request.body,
              signature,
              endpointSecretConnect,
            )
          } catch (err: any) {
            console.log(
              `⚠️  Webhook signature verification failed.`,
              err.message,
            )
            return response.sendStatus(400)
          }
        }
        await handleStripeEvent(event)
        // Return a 200 response to acknowledge receipt of the event
        response.send()
      } catch (error: any) {
        console.log('🚀 ~ file: index.ts:161 ~ error', error)
        response.status(400).send({
          message: error?.message || 'Look At Server Logs!',
        })
      }
    },
  )
  express.use(async (req, res, next) => {
    const ctx = await createContext({ req, res })
    req.ctx = ctx

    next()
  })

  express.use(app.json())

  express.post('/rest/login', async (req, res) => {
    try {
      const { email, password } = req.body
      const user = await prisma.user.findFirst({
        where: {
          email,
          role: 'platformAdmin',
        },
      })
      if (!user) {
        return res.status(400).send({
          message: 'User not found',
        })
      }
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return res.status(401).send({
          accessToken: null,
          message: 'Invalid Password!',
        })
      }
      const token = req.ctx.auth.signInWithJWT(user)

      res.status(200).send({
        user: user,
        token,
      })
    } catch (err: any) {
      res.status(500).send({ message: err.message })
    }
  })
  express.get('/rest/users', async (req, res) => {
    if (req.ctx?.user?.role !== 'platformAdmin')
      return res.status(401).send({ message: 'Unauthorized' })
    if (req.query?.take && Number(req.query?.take) > 100)
      return res.status(400).send({ message: 'Take must be less than 100' })

    try {
      const apps = await prisma.app.findMany({
        select: {
          id: true,
          name: true,
          planStatus: true,
          nextBill: true,
          trialEndDate: true,
          AndroidProfile: { select: { id: true } },
          iosProfile: { select: { id: true } },
        },
        take: Number(req.query?.take || 10),
        skip: Number(req.query?.skip || 0),
        where: req.query?.companyDomain
          ? {
              owner: {
                builderDomain: req.query?.companyDomain,
              },
            }
          : undefined,

        orderBy: {
          id: 'desc',
        },
      })
      const count = await prisma.app.count({
        where: req.query?.companyDomain
          ? {
              owner: {
                builderDomain: req.query?.companyDomain,
              },
            }
          : undefined,
      })
      res.status(200).send({ apps, count })
    } catch (err: any) {
      res.status(500).send({ message: err.message })
    }
  })

  express.get('/rest/stripe/:domain', async (req, res) => {
    console.log('🚀 ~ file: index.ts:245 ~ express.get ~ req:', req.params)
    if (req.ctx?.user?.role !== 'platformAdmin')
      return res.status(401).send({ message: 'Unauthorized' })
    // if (req.query?.take && Number(req.query?.take) > 100)
    //   return res.status(400).send({ message: 'Take must be less than 100' })

    const builder = await prisma.builder.findUnique({
      where: {
        domain: req.params.domain,
      },
      select: {
        stripeAccountId: true,
      },
    })

    const account = builder?.stripeAccountId
      ? await stripe.accounts.retrieve(builder?.stripeAccountId!)
      : {
          details_submitted: false,
        }
    try {
      res.status(200).send({
        stripeAccountId: builder?.stripeAccountId,
        isConnected: Boolean(account.details_submitted!),
      })
    } catch (err: any) {
      res.status(500).send({ message: err.message })
    }
  })
}

const handleStripeEvent = async (event) => {
  const subscription = event.data.object as Stripe.Subscription
  console.log(
    '🚀 ~ file: index.ts:246 ~ handleStripeEvent ~ subscription:',
    subscription,
  )
  let status

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      console.log('🚀 ~ file: index.ts ~ line 47 ~ session', session)
      status = session.status
      if (status == 'complete' && session.payment_status == 'paid') {
        if (
          session.mode == 'payment' &&
          session.metadata?.appId &&
          session.metadata.startTrial == 'true'
        ) {
          return await createSubscription(Number(session.metadata?.appId!))
        }

        if (!session.metadata?.appId || !session.subscription) {
          throw new Error('AppId or SubscriptionId is missing')
        }

        await prisma.app.update({
          where: {
            id: Number(session.metadata?.appId),
          },
          data: {
            //@ts-ignore
            stripeSubId: session.subscription! || undefined,
            // owner: { update: { stripeCustomerId: subscription.customer } },
          },
        })
      }
      console.log(`Subscription status is ${status}.`)
      // Then define and call a method to handle the subscription trial ending.
      // handleSubscriptionTrialEnding(subscription);
      break
    case 'customer.subscription.trial_will_end':
      status = subscription.status
      console.log(`Subscription status is ${status}.`)
      // Then define and call a method to handle the subscription trial ending.
      // handleSubscriptionTrialEnding(subscription);
      await handleSubscription(event.data.object)
      await prisma.app.update({
        where: { id: Number(subscription.metadata.appId) },
        data: {
          trialEndDate: new Date(),
          isTrialEnd: true,
        },
      })

      break
    case 'customer.subscription.deleted':
      console.log('🚀 ~ file: index.ts ~ line 73 ~ subscription', subscription)
      status = subscription.status
      console.log(`Subscription status is ${status}.`)
      // Then define and call a method to handle the subscription deleted.
      // handleSubscriptionDeleted(subscriptionDeleted);
      await handleSubscription(event.data.object)

      break
    case 'customer.subscription.created':
      await handleSubscription(event.data.object)
      await axios.post('https://hooks.zapier.com/hooks/catch/8366730/31zbzcq', {
        ...subscription.metadata,
        amount:
          Number(subscription.items.data[0].price.unit_amount_decimal) / 100,
        frequency:
          subscription.items.data[0].price.recurring?.interval_count +
          ' ' +
          subscription.items.data[0].price.recurring?.interval,
      })
      // Then define and call a method to handle the subscription created.
      // handleSubscriptionCreated(subscription);
      break
    case 'customer.subscription.updated':
      await handleSubscription(event.data.object)

      // Then define and call a method to handle the subscription update.
      // handleSubscriptionUpdated(subscription);
      break
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`)
  }
}

export default router
