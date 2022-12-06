import { arg, extendType, intArg, nonNull, objectType, stringArg } from 'nexus'
import { sendNotifications } from '../../utils/notifications'

export const Notification = objectType({
  name: 'Notification',
  definition(t) {
    t.model.id()
    t.model.body()
    t.model.title()
    t.model.data()
    t.model.createdAt()
    t.model.publishAt()
    t.model.status()
  },
})
export const NotificationsQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.notifications({ filtering: true, ordering: true, pagination: true })

    t.field('notifications', {
      type: objectType({
        name: 'NotificationsConnectionPayLoad',
        definition(t) {
          t.int('count')
          t.list.field('nodes', { type: 'Notification' })
        },
      }),
      args: {
        skip: intArg(),
        take: intArg(),
        orderBy: 'NotificationOrderByWithRelationInput',
        appId: nonNull(intArg()),
        where: 'NotificationWhereInput',
      },
      async resolve(source, { appId, ...args }, ctx) {
        //@ts-ignore
        args.where = {
          //@ts-ignore
          ...args.where,
          appid: { equals: appId },
        } //@ts-ignore
        const count = await ctx.db.notification.count({ where: args.where })

        return {
          //@ts-ignore
          count,
          //@ts-ignore

          nodes: await ctx.db.notification.findMany(args),
        }
      },
    })
  },
})
export const NotifiMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('addNotification', {
      type: 'Notification',
      args: {
        appId: nonNull(intArg()),
        title: nonNull(stringArg()),
        body: nonNull(stringArg()),
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
    t.field('updateNotification', {
      type: 'Notification',
      args: {
        id: nonNull(intArg()),
        title: nonNull(stringArg()),
        body: nonNull(stringArg()),
        publishAt: arg({ type: 'DateTime' }),
      },

      async resolve(_root, { id, title, body, publishAt }, ctx) {
        const notifiacation = await ctx.db.notification.findUnique({
          where: { id },
        })
        if (notifiacation?.status !== 'waiting')
          throw new Error("You can't edit this Notification")

        await ctx.db.notification.update({
          where: { id },
          data: {
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
    t.field('removeNotification', {
      type: 'Notification',
      args: {
        id: nonNull(intArg()),
      },

      async resolve(_root, { id }, ctx) {
        const notifiacation = await ctx.db.notification.findUnique({
          where: { id },
        })
        if (notifiacation?.status !== 'waiting')
          throw new Error("You can't edit this Notification")

        await ctx.db.notification.delete({
          where: { id },
        })
        try {
        } catch (error) {
          console.log('🚀 ~ file: Notification.ts:31 ~ resolve ~ error', error)
        }
        return notifiacation
      },
    })
  },
})
