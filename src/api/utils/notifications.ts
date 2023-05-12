import { prisma } from './createContext'
import { Expo } from 'expo-server-sdk'
let expo = new Expo()
let isRunning = false
export const sendNotifications = async () => {
  if (isRunning) return
  isRunning = true
  try {
    await prisma.notification.updateMany({
      where: {
        status: 'waiting',
        publishAt: { lte: new Date() },
        OR: [
          {
            App: { notificationData: { googleServiceJson: { equals: null } } },
          },
          {
            App: { notificationData: null },
          },
        ],
      },
      data: { status: 'failed' },
    })
    const notifications = await prisma.notification.findMany({
      where: { status: 'waiting', publishAt: { lte: new Date() } },
      select: {
        title: true,
        body: true,
        appid: true,
        id: true,
        to: { select: { id: true } },
        toType: true,
      },
    })
    console.log(
      '🚀 ~ file: notifications.ts:35 ~ sendNotifications ~ notifications:',
      notifications,
    )
    // await prisma.notificationToken.delete({
    //   where: {
    //     id: 188,
    //   },
    // })
    await Promise.all(
      notifications.map(async ({ appid, body, title, id, toType, to }) => {
        const users = await prisma.notificationToken.findMany({
          where: {
            appid,
            userId:
              toType == 'all'
                ? undefined
                : toType == 'auth'
                ? { not: null }
                : toType == 'nonAuth'
                ? { equals: null }
                : { in: to.map(({ id }) => id) },
          },
          select: { token: true },
        })
        try {
          await pushNotification({ body, title }, users)
          await prisma.notification.update({
            where: { id },
            data: { status: 'success' },
          })
        } catch (error) {
          console.log(
            '🚀 ~ file: notifications.ts:20 ~ awaitPromise.all ~ error',
            error,
          )
          await prisma.notification.update({
            where: { id },
            data: { status: 'failed' },
          })
        }
      }),
    )
  } catch (error) {
    console.log(
      '🚀 ~ file: notifications.ts:41 ~ sendNotifications ~ error',
      error,
    )
  }
  isRunning = false
}

const pushNotification = async ({ body, title }, users) => {
  // Create the messages that you want to send to clients
  let messages: any = []
  const tokens = users.map(({ token }) => token)
  console.log(
    '🚀 ~ file: notifications.ts:84 ~ pushNotification ~ users:',
    users,
  )
  for (let pushToken of tokens) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`)
      continue
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
      to: pushToken,
      sound: 'default',
      body,
      title,
      //   data: { withSome: 'data' },
    })
  }

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages)
  let tickets: any = []
  // Send the chunks to the Expo push notification service. There are
  // different strategies you could use. A simple one is to send one chunk at a
  // time, which nicely spreads the load out over time:
  for (let chunk of chunks) {
    // try {
    let ticketChunk = await expo.sendPushNotificationsAsync(chunk)
    console.log(
      '🚀 ~ file: notifications.ts:73 ~ pushNotification ~ ticketChunk',
      ticketChunk,
    )
    tickets.push(...ticketChunk)
    // NOTE: If a ticket contains an error code in ticket.details.error, you
    // must handle it appropriately. The error codes are listed in the Expo
    // documentation:
    // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
    // } catch (error) {
    //   console.log(
    //     '🚀 ~ file: notifications.ts:80 ~ pushNotification ~ error',
    //     error,
    //   )
    // }
  }
}
