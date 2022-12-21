// const prisma = new PrismaClient()

import axios from 'axios'
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
    select: {
      name: true,
      id: true,
      owner: { select: { email: true, builderDomain: true } },
    },
  })
  Promise.all(
    apps.map(async ({ id, name, owner }) => {
      try {
        await axios.post(
          'https://hooks.zapier.com/hooks/catch/14011457/b7hilg9/',
          {
            appName: name,
            email: owner?.email,
            url: 'https://' + owner?.builderDomain,
          },
          {
            //@ts-ignore
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        )
      } catch (error) {
        console.log('🚀 ~ file: cron.ts:43 ~ apps.map ~ error', error)
      }

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
// axios
//   .post(
//     'https://hooks.zapier.com/hooks/catch/14011457/b7hilg9/',
//     {
//       appName: 'name',
//       email: 'ahmedmagdyb7r@gmail.com',
//       url: 'https://' + 'owner?.builderDomain',
//     },
//     {
//       //@ts-ignore
//       Accept: 'application/json',
//       'Content-Type': 'application/json',
//     },
//   )
//   .then((d) => {
//     console.log('🚀 ~ file: cron.ts:82 ~ ).then ~ d', d)
//   })
//   .catch((err) => {
//     console.log('🚀 ~ file: cron.ts:82 ~ ).then ~ d', err)
//   })
