import { arg, extendType, intArg, objectType, stringArg } from 'nexus'
import { sendNotifications } from '../../utils/notifications'

export const NotifiMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('pushNotification', {
      type: 'Json',
      args: {
        appId: intArg(),
        title: stringArg(),
        body: stringArg(),
        publishAt: arg({ type: 'DateTime' }),
      },

      async resolve(_root, { appId, title, body, publishAt }, ctx) {
        const notifiacation = await ctx.db.notification.create({
          data: {
            App: { connect: { id: appId } },
            title,
            body,
            publishAt,
          },
        })
        try {
          await sendNotifications()
        } catch (error) {
          console.log('🚀 ~ file: Notification.ts:31 ~ resolve ~ error', error)
        }
        return notifiacation
      },
    })
  },
})
