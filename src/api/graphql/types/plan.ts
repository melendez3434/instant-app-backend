import moment from 'moment'
import { extendType, intArg, nonNull } from 'nexus'
import { stripe } from '../../REST'

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
        console.log(
          '🚀 ~ file: plan.ts:18 ~ resolve ~ YOUR_DOMAIN:',
          YOUR_DOMAIN,
        )

        // const prices = await stripe.prices.list({
        //   expand: ['data.product'],

        // })
        // console.log('🚀 ~ file: plan.ts ~ line 18 ~ resolve ~ prices', prices)

        // const price =prices.data.find(({id})=>id==process.env.STRIPE_PRODUCT_ID)
        // console.log('🚀 ~ file: plan.ts ~ line 18 ~ resolve ~ price', price)

        const user = await ctx.db.user.findUnique({
          where: { id: ctx.user.id },
        })
        console.log('🚀 ~ file: plan.ts:35 ~ resolve ~ user:', user)
        const app = await ctx.db.app.findUnique({
          where: { id },
          select: { stripeSubId: true, id: true, name: true, trialLong: true },
        })
        const builder = await ctx.db.builder.findUnique({
          where: { domain: ctx.builderDomain },
          select: { stripeAccountId: true, companyName: true },
        })
        let account: any = {}
        try {
          account = await stripe.accounts.retrieve(builder?.stripeAccountId!)
          console.log('🚀 ~ file: plan.ts:45 ~ resolve ~ account:', account)
        } catch (error) {
          console.log('🚀 ~ file: plan.ts:49 ~ resolve ~ error:', error)
        }
        const price =
          user?.utmPlan == 'new'
            ? process.env.STRIPE_PRODUCT_ID_NEW
            : user?.utmPlan == 'annual'
            ? process.env.STRIPE_PRODUCT_ID_ANNUAL
            : process.env.STRIPE_PRODUCT_ID
        const priceOfProduct = await stripe.prices.retrieve(price!)
        console.log(
          '🚀 ~ file: plan.ts:56 ~ resolve ~ priceOfProduct:',
          priceOfProduct,
        )
        let lastPrice = price

        if (builder?.stripeAccountId && account?.details_submitted) {
          const prices = await stripe.prices.list(
            {},
            {
              stripeAccount: builder?.stripeAccountId,
            },
          )
          console.log('🚀 ~ file: plan.ts:63 ~ resolve ~ prices:', prices)
          lastPrice = prices.data.find(
            (price) =>
              // price.product == priceOfProduct.product &&
              price.unit_amount == priceOfProduct.unit_amount &&
              price.recurring?.interval == priceOfProduct.recurring?.interval,
          )?.id
          if (!lastPrice) {
            const products = await stripe.products.list(
              {},
              {
                stripeAccount: builder?.stripeAccountId,
              },
            )
            console.log('🚀 ~ file: plan.ts:74 ~ resolve ~ products:', products)
            const product = products.data.find(
              (product) =>
                product.name == (builder.companyName! || 'Instant App'),
            )
            console.log('🚀 ~ file: plan.ts:77 ~ resolve ~ product:', product)

            lastPrice = (
              await stripe.prices.create(
                {
                  unit_amount: priceOfProduct.unit_amount || 0,
                  currency: priceOfProduct.currency,
                  recurring: {
                    interval: priceOfProduct.recurring?.interval!,
                    interval_count: priceOfProduct.recurring?.interval_count,
                    // aggregate_usage: priceOfProduct.recurring?.aggregate_usage!,
                    trial_period_days:
                      priceOfProduct.recurring?.trial_period_days!,
                    usage_type: priceOfProduct.recurring?.usage_type!,
                  },
                  product_data: !product?.id
                    ? {
                        name: builder.companyName! || 'Instant App',
                      }
                    : undefined,
                  product: product?.id || undefined,
                },
                {
                  stripeAccount: builder?.stripeAccountId,
                },
              )
            ).id
          }
        }

        console.log('🚀 ~ file: builder.ts:23 ~ resolve ~ account:', account)

        const trialNumber = app?.trialLong
        try {
          if (app?.stripeSubId) {
            const returnUrl = YOUR_DOMAIN

            const portalSession = await stripe.billingPortal.sessions.create({
              customer: user?.stripeCustomerId!,
              return_url: returnUrl + `/app/${id}`,
            })

            return portalSession.url
          }
        } catch (error) {}
        const metadata: any = {
          builderName: ctx.builderDomain.split('.')[0],
          userId: user?.id.toString(),
          appId: app?.id.toString(),
          utm: user?.registerFrom,
          utmPlan: user?.utmPlan,
          trial: trialNumber,
          apollotrial:
            user?.registerFrom == 'apollosale' && trialNumber
              ? 'yes'
              : undefined,
        }
        let isCustomerExist: any = false
        console.log(
          '🚀 ~ file: plan.ts:88 ~ resolve ~ isCustomerExist:',
          isCustomerExist,
        )
        try {
          isCustomerExist = user?.stripeCustomerId
            ? await stripe.customers.retrieve(
                user?.stripeCustomerId,
                {},
                {
                  stripeAccount:
                    builder?.stripeAccountId && account?.details_submitted
                      ? builder?.stripeAccountId
                      : undefined,
                },
              )
            : false
        } catch (error) {
          console.log('🚀 ~ file: plan.ts:107 ~ resolve ~ error:', error)
        }
        console.log(
          '🚀 ~ file: plan.ts:88 ~ resolve ~ isCustomerExist:',
          isCustomerExist,
        )
        const customer = !isCustomerExist?.id
          ? await stripe.customers.create(
              {
                email: ctx.user.email,
                metadata,
              },
              {
                stripeAccount:
                  account?.details_submitted && builder?.stripeAccountId
                    ? builder?.stripeAccountId
                    : undefined,
              },
            )
          : { id: user?.stripeCustomerId }

        await ctx.db.user.update({
          where: { id: ctx.user.id },
          data: { stripeCustomerId: customer.id },
        })

        const session = await stripe.checkout.sessions.create(
          {
            billing_address_collection: 'auto',
            client_reference_id: user?.id.toString() ?? undefined,
            customer: customer?.id ?? undefined,
            customer_email: customer?.id ? undefined : ctx.user.email,

            metadata,
            line_items: [
              {
                // price: prices.data[0].id,
                price: lastPrice,

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
              application_fee_percent:
                builder?.stripeAccountId && account?.details_submitted
                  ? 25
                  : undefined,

              // transfer_data:
              //   builder?.stripeAccountId && account?.details_submitted
              //     ? {
              //         destination: builder?.stripeAccountId,
              //         amount_percent: 75,
              //       }
              //     : undefined,
            },

            mode: 'subscription',
            success_url: `${YOUR_DOMAIN}/app/${id}/deploy?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${YOUR_DOMAIN}/subscribe/?canceled=true`,
          },
          {
            stripeAccount:
              account?.details_submitted && builder?.stripeAccountId
                ? builder?.stripeAccountId
                : undefined,
          },
        )
        console.log('🚀 ~ file: plan.ts ~ line 31 ~ resolve ~ session', session)

        return session.url
      },
    })
    t.field('endMyTrial', {
      type: 'Boolean',
      args: { id: nonNull(intArg()) },
      async resolve(source, { id }, ctx) {
        try {
          const app = await ctx.db.app.findUnique({
            where: { id },
            select: { stripeSubId: true, id: true, name: true },
          })

          console.log('🚀 ~ file: plan.ts:115 ~ resolve ~ app:', app)

          const subscription = await stripe.subscriptions.update(
            app?.stripeSubId!,
            { trial_end: 'now' },
          )
          // await ctx.db.app.update({
          //   where: { id },
          //   data: { trialEndDate: new Date(), isTrialEnd: true },
          // })
        } catch (error) {
          console.log('🚀 ~ file: plan.ts:130 ~ resolve ~ error:', error)
          return false
        }
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
