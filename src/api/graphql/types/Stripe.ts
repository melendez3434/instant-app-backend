import { extendType } from 'nexus'
import { stripe } from '../../REST'

export const stripeMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('getStripeExpressLink', {
      type: 'String',
      async resolve(_root, args, { user, builderDomain, prisma }) {
        const builder = await prisma.builder.findUnique({
          where: { domain: user.builderDomain! },
          select: { stripeAccountId: true },
        })
        let accountId = builder?.stripeAccountId

        // Create a Stripe account for this user if one does not exist already
        if (accountId == undefined) {
          // Define the parameters to create a new Stripe account with

          const account = await stripe.accounts.create({
            type: 'express',
            // country: user.country || undefined,
            email: user.email || undefined,
            business_type: 'individual',
            individual: {
              first_name: user.name || undefined,
              //   last_name: user.lastName || undefined,
              email: user.email || undefined,
            },
          })
          accountId = account.id

          // Update the model and store the Stripe account ID in the datastore:
          // this Stripe account ID will be used to issue payouts to the pilot

          await prisma.builder.update({
            where: { domain: user.builderDomain! },
            data: { stripeAccountId: accountId },
          })
        }

        // Create an account link for the user's Stripe account
        const accountLink = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: 'https://' + builderDomain + '/profile',
          return_url: 'https://' + builderDomain + '/profile',
          type: 'account_onboarding',
        })

        // Redirect to Stripe to start the Express onboarding flow
        return accountLink.url
      },
    })
  },
})
