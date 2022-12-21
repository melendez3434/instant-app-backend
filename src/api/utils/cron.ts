// const prisma = new PrismaClient()

import moment from 'moment'
import { prisma } from './createContext'
import { sendNotifications } from './notifications'

var CronJobManager = require('cron-job-manager')

export const cronManager = new CronJobManager()

const options = {
  start: true,
  timeZone: 'UTC',
}

const stopTheTrial = async () => {
  const apps = await prisma.app.findMany({
    where: {
      planStatus: 'inTrial',
      isTrialEnd: false,
      createdAt: { lt: moment().subtract(14, 'day').toDate() },
    },
  })
  Promise.all(
    apps.map(async ({ id }) => {
      await prisma.app.update({
        where: {
          id,
        },
        data: { isTrialEnd: true },
      })
    }),
  )
}

export const startCron = async () => {
  cronManager.add(
    'checkWaitingHugeTasks',
    '*/5 * * * *',
    sendNotifications,
    options,
  )
  cronManager.add('checkWaitingHugeTasks', '0 * * * *', stopTheTrial, options)
}
