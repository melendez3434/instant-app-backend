import { prisma } from '../utils/createContext'
import moment from 'moment'

const app = require('express')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const router = (express) => {
  express.get('/rest', async (req, res) => {
    res.send('welcome again')
  })

  // This is your Stripe CLI webhook secret for testing your endpoint locally.
  const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET

  express.post(
    '/rest/stripe/webhook',
    app.raw({ type: 'application/json' }),
    async (request, response) => {
      let event = request.body
      // Replace this endpoint secret with your endpoint's unique secret
      // If you are testing with the CLI, find the secret by running 'stripe listen'
      // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
      // at https://dashboard.stripe.com/webhooks
      // Only verify the event if you have an endpoint secret defined.
      // Otherwise use the basic event deserialized with JSON.parse
      if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = request.headers['stripe-signature']
        try {
          event = stripe.webhooks.constructEvent(
            request.body,
            signature,
            endpointSecret,
          )
        } catch (err: any) {
          console.log(`⚠️  Webhook signature verification failed.`, err.message)
          return response.sendStatus(400)
        }
      }
      let subscription
      let status

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          subscription = event.data.object
          console.log(
            '🚀 ~ file: index.ts ~ line 47 ~ subscription',
            subscription,
          )
          status = subscription.status
          if (status == 'complete' && subscription.payment_status == 'paid') {
            await prisma.app.update({
              where: {
                id: Number(subscription.metadata.appId),
              },
              data: {
                stripeSubId: subscription.subscription,
                owner: { update: { stripeCustomerId: subscription.customer } },
              },
            })
          }
          console.log(`Subscription status is ${status}.`)
          // Then define and call a method to handle the subscription trial ending.
          // handleSubscriptionTrialEnding(subscription);
          break
        // case 'customer.subscription.trial_will_end':
        //   subscription = event.data.object
        //   status = subscription.status
        //   console.log(`Subscription status is ${status}.`)
        //   // Then define and call a method to handle the subscription trial ending.
        //   // handleSubscriptionTrialEnding(subscription);
        //   break
        case 'customer.subscription.deleted':
          subscription = event.data.object
          console.log(
            '🚀 ~ file: index.ts ~ line 73 ~ subscription',
            subscription,
          )
          status = subscription.status
          console.log(`Subscription status is ${status}.`)
          // Then define and call a method to handle the subscription deleted.
          // handleSubscriptionDeleted(subscriptionDeleted);
          break
        case 'customer.subscription.created':
          subscription = event.data.object
          subscription = event.data.object

          console.log(
            '🚀 ~ file: index.ts ~ line 62 ~ router ~ subscription',
            subscription,
          )
          status = subscription.status

          console.log(`Subscription status is ${status}.`)
          if (status == 'active') {
            await prisma.app.update({
              where: {
                id: Number(subscription.metadata.appId),
              },
              data: {
                planStatus: 'sub',
                nextBill: moment.unix(subscription.current_period_end).toDate(),
              },
            })
          } else {
            await prisma.app.update({
              where: { id: Number(subscription.metadata.appId) },
              data: {
                planStatus: 'stopped',
                // nextBill: moment.unix(subscription.current_period_end).toDate(),
              },
            })
            // stopped
          }

          // Then define and call a method to handle the subscription created.
          // handleSubscriptionCreated(subscription);
          break
        case 'customer.subscription.updated':
          subscription = event.data.object
          console.log(
            '🚀 ~ file: index.ts ~ line 114 ~ subscription',
            subscription,
          )
          status = subscription.status
          console.log(`Subscription status is ${status}.`)
          if (status == 'active') {
            await prisma.app.update({
              where: {
                id: Number(subscription.metadata.appId),
              },
              data: {
                planStatus: 'sub',
                nextBill: moment.unix(subscription.current_period_end).toDate(),
              },
            })
          } else {
            await prisma.app.update({
              where: { id: Number(subscription.metadata.appId) },
              data: {
                planStatus: 'stopped',
                // nextBill: moment.unix(subscription.current_period_end).toDate(),
              },
            })
            // stopped
          }
          // Then define and call a method to handle the subscription update.
          // handleSubscriptionUpdated(subscription);
          break
        default:
          // Unexpected event type
          console.log(`Unhandled event type ${event.type}.`)
      }
      // Return a 200 response to acknowledge receipt of the event
      response.send()
    },
  )
}

export default router
