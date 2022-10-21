// @ts-nocheck

import { arg, extendType, intArg, objectType, stringArg } from 'nexus'
import admin from '../../utils/notifiacation'

export const NotifiMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('pushNotification', {
      type: 'Json',
      args: {
        notification: arg({
          type: 'Json',
          required: true,
        }),
      },

      async resolve(_root, { notification }, ctx) {
        const users = await ctx.db.user.findMany({
          where: { notificationToken: { not: { equals: null } } },
          select: { notificationToken: true },
        })
        console.log('resolve -> users', users)
        // Create a list containing up to 500 registration tokens.
        // These registration tokens come from the client FCM SDKs.

        const message = {
          notification,
          tokens: users
            .filter(({ registrationTokens }) => registrationTokens)
            .map(({ registrationTokens }) => registrationTokens),
        }
        console.log(
          'resolve -> users.map(({ registrationTokens }) => registrationTokens)',
          users
            .filter(({ registrationTokens }) => registrationTokens)
            .map(({ registrationTokens }) => registrationTokens),
        )
        const response = await admin.messaging().sendMulticast(message)

        console.log(response.successCount + 'messages were sent successfully')
        return `${response.successCount} messages were sent successfully`
      },
    })
  },
})
