import {
  arg,
  extendType,
  inputObjectType,
  intArg,
  nonNull,
  objectType,
  stringArg,
} from 'nexus'
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
export const NotificationData = objectType({
  name: 'NotificationData',
  definition(t) {
    t.model.id()
    t.model.googleServiceJson()
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
    t.field('notificationData', {
      type: 'NotificationData',
      args: {
        id: nonNull(intArg()),
      },
      async resolve(source, { id }, ctx) {
        return await ctx.db.notificationData.findUnique({
          where: { appid: id },
        })
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
          sendNotifications().catch((e) => {
            console.log('🚀 ~ file: Notification.ts:106 ~ resolve ~ e', e)
          })
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
          sendNotifications().catch((e) => {
            console.log('🚀 ~ file: Notification.ts:106 ~ resolve ~ e', e)
          })
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

    t.field('updateNotificationData', {
      type: 'NotificationData',
      args: {
        id: nonNull(intArg()),
        data: nonNull(
          arg({
            type: inputObjectType({
              name: 'updateNotificationDataInput',
              definition(t) {
                t.nonNull.string('googleServiceJson')
              },
            }),
          }),
        ),
      },

      async resolve(_root, { id, data }, ctx) {
        const notificationData = await ctx.db.notificationData.upsert({
          where: { appid: id },
          create: {
            App: { connect: { id } },
            ...data,
          },
          update: {
            ...data,
          },
        })

        return notificationData
      },
    })
  },
})
