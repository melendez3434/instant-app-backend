// const prisma = new PrismaClient()

// import axios from 'axios'
// import moment from 'moment'
// import { prisma } from './createContext'
import { EmailTemplate, Prisma } from '@prisma/client'
import moment from 'moment'
import { prisma } from './createContext'
import { sendNotifications } from './notifications'
import sendSgMail, { MAILER_ITEMS } from './sgMail'

var CronJobManager = require('cron-job-manager')

export const cronManager = new CronJobManager()

const options = {
  start: true,
  timeZone: 'UTC',
}

// const stopTheTrial = async () => {
//   const apps = await prisma.app.findMany({
//     where: {
//       planStatus: 'inTrial',
//       isTrialEnd: false,
//       createdAt: { lt: moment().subtract(14, 'day').toDate() },
//     },
//     select: {
//       name: true,
//       id: true,
//       owner: { select: { email: true, builderDomain: true } },
//     },
//   })
//   Promise.all(
//     apps.map(async ({ id, name, owner }) => {
//       try {
//         await axios.post(
//           'https://hooks.zapier.com/hooks/catch/14011457/b7hilg9/',
//           {
//             appName: name,
//             email: owner?.email,
//             url: 'https://' + owner?.builderDomain,
//           },
//           {
//             //@ts-ignore
//             Accept: 'application/json',
//             'Content-Type': 'application/json',
//           },
//         )
//       } catch (error) {
//         console.log('🚀 ~ file: cron.ts:43 ~ apps.map ~ error', error)
//       }

//       await prisma.app.update({
//         where: {
//           id,
//         },
//         data: { isTrialEnd: true },
//       })
//     }),
//   )
// }
const sendAllNotifications = async () => {
  try {
    // await sendNotifications()
    // send welcome email after 10 minutes to every new app
    await sendWelcomeEmail()
    // send reminder email after 24 hour to every new app if the user didn't publish the app
    // await sendReminderEmail()
    // // send three day reminder email after 3 days to every new app if the user didn't publish the app
    // await sendThreeDayReminderEmail()
  } catch (error) {
    console.log('🚀 ~ file: cron.ts:68 ~ sendAllNotifications ~ error', error)
  }
}
const sendThreeDayReminderEmail = async () => {
  await sendEmailTemplate({
    flag: 'THREE_DAY_REMINDER',
    emailProps: {
      subject: ({ name }) => `Your ${name} app is ready!`,
    },
  })
}

const sendReminderEmail = async () => {
  await sendEmailTemplate({
    flag: 'REMINDER',
    emailProps: {
      subject: 'We’re ready for you...',
    },
  })
}

const sendWelcomeEmail = async () => {
  await sendEmailTemplate({
    flag: 'WELCOME',
    emailProps: {
      subject: (variables) =>
        `Welcome to ${variables.owner?.builder?.companyName}! `,
      // subject: ' Let’s get your app live! 2 Steps to go...',
    },
  })
}
const sendEmailTemplate = async ({
  flag,
  select = {},
  emailProps,
}: {
  select?: Prisma.AppSelect
  flag: EmailTemplate
  emailProps: {
    subject: string | ((variables?: any) => string)
    variables?: any
  }
}) => {
  const apps = await prisma.app.findMany({
    where: {
      NOT: { emailsFlags: { hasSome: [flag] } },
      // createdAt: { lt: moment().subtract(24, 'hour').toDate() },
      createdAt:
        flag === 'THREE_DAY_REMINDER'
          ? {
              lt: moment().subtract(3, 'day').toDate(),
              gt: moment().subtract(4, 'day').toDate(),
            }
          : flag === 'REMINDER'
          ? {
              lt: moment().subtract(24, 'hour').toDate(),
              gt: moment().subtract(25, 'hour').toDate(),
            }
          : flag === 'WELCOME'
          ? {
              lt: moment().toDate(),
              gt: moment().subtract(60, 'minute').toDate(),
            }
          : undefined,
      // AND: [{ AndroidProfile: { is: null } }, { iosProfile: { is: null } }],
    },
    select: {
      ...select,

      name: true,
      id: true,
      tempOwner: true,
      owner: {
        select: {
          name: true,
          email: true,
          builderDomain: true,
          builder: {
            select: {
              companyName: true,
            },
          },
        },
      },
    },
  })
  console.log(
    '🚀 ~ file: cron.ts:150 ~ apps:',
    apps,
    flag,
    await prisma.app.findMany({
      take: 1,
      orderBy: { createdAt: 'desc' },
    }),
    // await prisma.app.updateMany({
    //   where: {
    //     id: 60,
    //   },
    //   data: {
    //     emailsFlags: {
    //       set: [],
    //     },
    //   },
    // }),
  )
  Promise.all(
    apps.map(async (variables) => {
      const { id, name, owner, tempOwner } = variables
      const EmailAddress = owner?.email || tempOwner
      const subject =
        typeof emailProps.subject === 'function'
          ? emailProps.subject(variables)
          : emailProps.subject
      try {
        EmailAddress &&
          (await sendSgMail({
            to: EmailAddress,
            subject,
            templateId: MAILER_ITEMS[flag],
            dynamic_template_data: {
              // customerName: owner?.name || tempOwner,
              customerName: owner?.email.split('@')[0],
              companyName: owner?.builder?.companyName,
              currentYear: new Date().getFullYear(),
              profileLink: `https://${owner?.builderDomain}/profile`,
              unsubscribeLink: `https://${owner?.builderDomain}/unsubscribe`,
              appName: name,
              url: 'https://' + owner?.builderDomain,
              ...(emailProps.variables || {}),
            },
          }))

        await prisma.app.update({
          where: {
            id,
          },
          data: {
            emailsFlags: {
              push: [flag],
            },
          },
        })
      } catch (error) {
        //@ts-ignore
        console.log('🚀 ~ file: sgMail.ts:29 ~ error', error?.response?.body)

        console.log('🚀 ~ file: cron.ts:43 ~ apps.map ~ error', error)
      }
    }),
  )
}

export const startCron = async () => {
  // sendAllNotifications()
  cronManager.add(
    'sendNotifications',
    '*/5 * * * *',
    sendAllNotifications,
    options,
  )
  cronManager.add(
    'sendNotifications',
    '*/5 * * * *',
    sendNotifications,
    options,
  )
  // cronManager.add('stopTheTrial', '0 * * * *', stopTheTrial, options)
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
// prisma.user
//   .deleteMany({
//     where: {
//       email: {
//         in: ['instantappbuilder@gmail.com'],
//       },
//     },
//   })
//   .finally(() => {
//     console.log('done')
//   })
