// const prisma = new PrismaClient()

import { sendNotifications } from './notifications'

var CronJobManager = require('cron-job-manager')

export const cronManager = new CronJobManager()

const options = {
  start: true,
  timeZone: 'UTC',
}

export const startCron = async () => {
  cronManager.add(
    'checkWaitingHugeTasks',
    '*/5 * * * *',
    sendNotifications,
    options,
  )
}
