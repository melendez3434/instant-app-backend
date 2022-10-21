import { subscriptionType } from 'nexus'
// import { PubSub } from 'graphql-subscriptions'

// const pubsub = new PubSub()

export const Subscription = subscriptionType({
  definition(t) {
    t.field('hello', {
      type: 'String',

      subscribe: (_root, _args, ctx) => ctx.pubsub.asyncIterator('hello'),

      resolve(payload) {
        console.log(
          '🚀 ~ file: subscription.ts ~ line 11 ~ resolve ~ payload',
          payload,
        )
        return 'payload'
      },
    })
  },
})
