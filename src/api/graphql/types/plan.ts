import moment from 'moment'
import { extendType, intArg, nonNull } from 'nexus'

// This is your test secret API key.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

export const PlanMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('subscribe', {
      type: 'String',
      args: {
        id: nonNull(intArg()),
        // trial: intArg(),
      },
      async resolve(source, { id }, ctx) {
        const YOUR_DOMAIN = 'http://' + ctx.builderDomain

        // const prices = await stripe.prices.list({
        //   expand: ['data.product'],

        // })
        // console.log('🚀 ~ file: plan.ts ~ line 18 ~ resolve ~ prices', prices)

        // const price =prices.data.find(({id})=>id==process.env.STRIPE_PRODUCT_ID)
        // console.log('🚀 ~ file: plan.ts ~ line 18 ~ resolve ~ price', price)

        const user = await ctx.db.user.findUnique({
          where: { id: ctx.user.id },
        })
        const app = await ctx.db.app.findUnique({
          where: { id },
          select: { stripeSubId: true, id: true, name: true, trialLong: true },
        })
        const trialNumber = app?.trialLong

        if (app?.stripeSubId) {
          const returnUrl = YOUR_DOMAIN

          const portalSession = await stripe.billingPortal.sessions.create({
            customer: user?.stripeCustomerId,
            return_url: returnUrl + `/app/${id}`,
          })

          return portalSession.url
        }
        const metadata = {
          builderName: ctx.builderDomain.split('.')[0],
          userId: user?.id,
          appId: app?.id,
          utm: user?.registerFrom,
        }
        const customer = !user?.stripeCustomerId
          ? await stripe.customers.create({
              email: ctx.user.email,
              metadata,
            })
          : { id: user?.stripeCustomerId }
        !user?.stripeCustomerId &&
          (await ctx.db.user.update({
            where: { id: ctx.user.id },
            data: { stripeCustomerId: customer.id },
          }))
        const session = await stripe.checkout.sessions.create({
          billing_address_collection: 'auto',
          client_reference_id: user?.id,
          customer: customer?.id ?? undefined,
          customer_email: customer?.id ? undefined : ctx.user.email,

          metadata,
          line_items: [
            {
              // price: prices.data[0].id,
              price: process.env.STRIPE_PRODUCT_ID,

              // For metered billing, do not pass quantity
              quantity: 1,
            },
          ],
          // payment_intent_data: {
          //   metadata,
          // },
          subscription_data: {
            metadata,
            description: app?.name,
            // trial_end: moment().add(3, 'day').unix(),
            trial_period_days: trialNumber || undefined,
          },
          mode: 'subscription',
          success_url: `${YOUR_DOMAIN}/app/${id}/deploy?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${YOUR_DOMAIN}/subscribe/?canceled=true`,
        })
        console.log('🚀 ~ file: plan.ts ~ line 31 ~ resolve ~ session', session)

        return session.url
      },
    })
    t.field('endMyTrial', {
      type: 'Boolean',
      args: { id: nonNull(intArg()) },
      async resolve(source, { id }, ctx) {
        const app = await ctx.db.app.findUnique({
          where: { id },
          select: { stripeSubId: true, id: true, name: true },
        })

        const subscription = await stripe.subscriptions.update(
          app?.stripeSubId,
          { trial_end: 'now' },
        )
        // await ctx.db.app.update({
        //   where: { id },
        //   data: { trialEndDate: new Date(), isTrialEnd: true },
        // })
        return true
      },
    })

    // t.field('editMyPlan', {
    //   type: 'String',

    //   async resolve(source, args, ctx) {
    //     const YOUR_DOMAIN = 'http://' + ctx.builderDomain

    //     // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
    //     // Typically this is stored alongside the authenticated user in your database.
    //     const { stripeSubId } = ctx.user
    //     const checkoutSession = await stripe.checkout.sessions.retrieve(
    //       stripeId:stripeSubId,
    //     )

    //     // This is the url to which the customer will be redirected when they are done
    //     // managing their billing with the portal.
    //     const returnUrl = YOUR_DOMAIN

    //     const portalSession = await stripe.billingPortal.sessions.create({
    //       customer: checkoutSession.customer,
    //       return_url: returnUrl,
    //     })

    //     return portalSession.url
    //   },
    // })
  },
})
