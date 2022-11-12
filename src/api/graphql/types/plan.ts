import { extendType } from 'nexus'

// This is your test secret API key.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

export const PlanMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('subscribe', {
      type: 'String',

      async resolve(source, args, ctx) {
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
        if (user?.stripeCustomerId) {
          const returnUrl = YOUR_DOMAIN

          const portalSession = await stripe.billingPortal.sessions.create({
            customer: user?.stripeCustomerId,
            return_url: returnUrl,
          })

          return portalSession.url
        }

        const session = await stripe.checkout.sessions.create({
          billing_address_collection: 'auto',
          client_reference_id: user?.id,
          customer: user?.stripeCustomerId || undefined,
          customer_email: user?.stripeCustomerId ? undefined : ctx.user.email,

          metadata: { builderName: ctx.builderDomain.split('.')[0] },
          line_items: [
            {
              // price: prices.data[0].id,
              price: process.env.STRIPE_PRODUCT_ID,

              // For metered billing, do not pass quantity
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${YOUR_DOMAIN}/subscribe/?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${YOUR_DOMAIN}/subscribe/?canceled=true`,
        })
        console.log('🚀 ~ file: plan.ts ~ line 31 ~ resolve ~ session', session)

        return session.url
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
