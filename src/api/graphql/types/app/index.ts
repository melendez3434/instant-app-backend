import moment from 'moment'
import {
  arg,
  extendType,
  inputObjectType,
  intArg,
  nonNull,
  objectType,
} from 'nexus'
import { stripe } from '../../../REST'
import { prisma } from '../../../utils/createContext'
import { sendEmailTemplate } from '../../../utils/cron'
var url = require('url')

export const App = objectType({
  name: 'App',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.appId()
    t.model.website()
    t.model.userAgent()
    t.model.lang()
    t.model.assets()
    t.model.nextBill()
    t.model.design()
    t.model.planStatus()
    t.model.createdAt()
    t.model.owner()
    t.model.isTrialEnd()
    t.model.trialLong()
    t.model.mustAuth()
    t.model.paymentAmount({
      async resolve({ paymentAmount, stripeSubId, id }) {
        try {
          if (!paymentAmount && stripeSubId) {
            const subscription = await stripe.subscriptions.retrieve(
              stripeSubId,
            )
            paymentAmount =
              (subscription?.items?.data?.[0]?.price?.unit_amount || 0) / 100

            await prisma.app.update({
              where: {
                id,
              },
              data: {
                paymentAmount,
              },
            })
          }
        } catch (error) {
          console.log('🚀 ~ file: index.ts:40 ~ resolve ~ error:', error)
        }
        return paymentAmount
      },
    })
    t.field('daysLeftInTrial', {
      type: 'Int',
      async resolve({ trialEndDate, planStatus }, args, ctx) {
        const daysLeft = moment(trialEndDate).diff(moment(), 'days')

        return daysLeft > 0 ? daysLeft : 0
      },
    })
  },
})

export const AppAsset = objectType({
  name: 'AppAsset',
  definition(t) {
    t.model.id()
    t.model.appIcon()
    t.model.logo()
    t.model.splashMode()
    t.model.color()
    t.model.textThemeMode()
    t.model.displayLogo()
    t.model.tagLine()
    t.model.delay()
    t.model.backgroundImage()
    t.model.createdAt()
  },
})
export const AppDesign = objectType({
  name: 'AppDesign',
  definition(t) {
    t.model.id()
    t.model.activeTabColor()
    t.model.disblayPagetitle()
    t.model.layoutTemplate()
    t.model.navigationActiveColor()
    t.model.progressIndicator()
    t.model.progressIndicatorColor()
    t.model.pullToRefresh()
    t.model.themeColor()
    t.model.titleTheme()
    t.model.AppDesignDrawer()
  },
})
export const AppDesignDrawer = objectType({
  name: 'AppDesignDrawer',
  definition(t) {
    t.model.id()
    t.model.backgroundImage()
    t.model.color()
    t.model.displayLogo()
    t.model.drawerMode()
    t.model.logo()
    t.model.subTitle()
    t.model.textTheme()
    t.model.title()
  },
})
export const Link = objectType({
  name: 'Link',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.data()
    t.model.type()
    t.model.icon()
  },
})
export const AppQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.app()
    t.field('app', {
      type: 'App',
      args: {
        id: nonNull(intArg()),
      },
      async resolve(source, args, ctx) {
        const { id } = args
        return await ctx.db.app.findUnique({ where: { id } })
      },
    })
    t.crud.apps({ filtering: true, ordering: true, pagination: true })
    t.field('apps', {
      type: objectType({
        name: 'AppConnectionPayLoad',
        definition(t) {
          t.int('count')
          t.list.field('nodes', { type: 'App' })
        },
      }),
      args: {
        skip: intArg(),
        take: intArg(),
        orderBy: 'AppOrderByWithRelationInput',
        where: 'AppWhereInput',
      },
      async resolve(source, args, ctx) {
        args.where = { ...args.where, ownerId: { equals: ctx.user.id } }
        return {
          //@ts-ignore
          count: await ctx.db.app.count({ where: args.where }),
          //@ts-ignore

          nodes: await ctx.db.app.findMany(args),
        }
      },
    })
    t.field('allApps', {
      type: 'AppConnectionPayLoad',
      args: {
        skip: intArg(),
        take: intArg(),
        orderBy: 'AppOrderByWithRelationInput',
        where: 'AppWhereInput',
      },
      async resolve(source, args, ctx) {
        args.where = {
          ...args.where,
          owner: { builderDomain: { equals: ctx.builderDomain } },
        }

        return {
          //@ts-ignore
          count: await ctx.db.app.count({ where: args.where }),
          //@ts-ignore

          nodes: await ctx.db.app.findMany(args),
        }
      },
    })
  },
})
export const Appmutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('addApp', {
      type: 'App',
      args: {
        data: arg({
          type: inputObjectType({
            name: 'addAppInput',
            definition(t) {
              t.nonNull.string('name')
              t.nonNull.string('website')
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        let { name, website } = args.data
        if (!website.includes('https://')) {
          website = 'https://' + website
        }

        const appId = url
          .parse(website)
          ?.hostname?.split('.')
          .reverse()
          .join('.')
        if (!appId) throw new Error('Invalid website')

        return await ctx.db.app.create({
          data: {
            name,
            website,
            lang: 'EN',
            appId,
            assets: { create: { displayLogo: true, color: '#000' } },
            design: { create: { AppDesignDrawer: { create: {} } } },

            owner: { connect: { id: ctx.user.id } },
          },
        })
      },
    })

    t.field('updateLiveUrl', {
      type: 'App',
      args: {
        id: nonNull(intArg()),
        data: arg({
          type: inputObjectType({
            name: 'updateLiveUrlInput',
            definition(t) {
              t.string('url')
              t.field({ name: 'platform', type: 'AppBuildPlatform' })
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        let { platform, url } = args.data
        const app = await ctx.db.app.update({
          where: { id: args.id },
          data: {
            iosLiveUrl: platform == 'ios' ? url : undefined,
            androidLiveUrl: platform == 'android' ? url : undefined,
          },
        })

        sendEmailTemplate({
          id: args.id,
          flag: platform == 'android' ? 'ANDROID_PUBLISH' : 'IOS_PUBLISH',
        })
          .then((res) => console.log(res))
          .catch((err) => console.log(err))

        return app
      },
    })
    t.field('updateApp', {
      type: 'App',
      args: {
        id: nonNull(intArg()),
        data: arg({
          type: inputObjectType({
            name: 'updateAppInput',
            definition(t) {
              t.string('name')
              t.string('website')
              t.string('lang')
              t.string('appId')
              t.string('userAgent')
              t.boolean('mustAuth')
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        let { name, website, appId, lang, userAgent, mustAuth } = args.data
        return await ctx.db.app.update({
          where: { id: args.id },
          data: {
            name: name ?? undefined,
            website: website ?? undefined,
            appId: appId ?? undefined,
            lang: lang ?? undefined,
            userAgent,
            mustAuth: mustAuth ?? undefined,
          },
        })
      },
    })
    t.field('updateAppAssets', {
      type: 'AppAsset',
      args: {
        id: nonNull(intArg()),
        data: arg({
          type: inputObjectType({
            name: 'updateAppAssetsInput',
            definition(t) {
              t.string('appIcon')
              t.string('logo')
              t.field('splashMode', { type: 'SplashMode' })
              t.field('textThemeMode', { type: 'ThemeMode' })
              t.string('color')
              t.boolean('displayLogo')
              t.string('tagLine')
              t.float('delay')
              t.string('backgroundImage')
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        // let { ...} = args.data
        return await ctx.db.appAsset.update({
          where: { appid: args.id },
          //@ts-ignore
          data: {
            ...args.data,
          },
        })
      },
    })
    t.field('updateAppDesign', {
      type: 'AppDesign',
      args: {
        id: nonNull(intArg()),
        data: arg({
          type: inputObjectType({
            name: 'updateAppDesignInput',
            definition(t) {
              t.string('activeTabColor')
              t.string('themeColor')
              t.field('titleTheme', { type: 'ThemeMode' })
              t.boolean('disblayPagetitle')
              t.field('layoutTemplate', { type: 'LayoutTemplate' })
              t.field('progressIndicator', { type: 'ProgressIndicator' })

              t.boolean('pullToRefresh')

              t.string('progressIndicatorColor')
              t.string('navigationActiveColor')
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        // let { ...} = args.data
        return await ctx.db.appDesign.upsert({
          where: { appId: args.id },
          //@ts-ignore
          create: {
            ...args.data,
            App: { connect: { id: args.id } },
          },
          update: {
            activeTabColor: args.data.activeTabColor ?? undefined,
            themeColor: args.data.themeColor ?? undefined,
            titleTheme: args.data.titleTheme ?? undefined,
            disblayPagetitle: args.data.disblayPagetitle ?? undefined,
            layoutTemplate: args.data.layoutTemplate ?? undefined,
            progressIndicator: args.data.progressIndicator ?? undefined,
            pullToRefresh: args.data.pullToRefresh ?? undefined,
            progressIndicatorColor:
              args.data.progressIndicatorColor ?? undefined,
            navigationActiveColor: args.data.navigationActiveColor ?? undefined,
          },
        })
      },
    })
    t.field('updateAppDesignDrawer', {
      type: 'AppDesignDrawer',
      args: {
        id: nonNull(intArg()),
        data: arg({
          type: inputObjectType({
            name: 'updateAppDesignDrawerInput',
            definition(t) {
              t.string('backgroundImage')
              t.string('color')
              t.string('logo')
              t.string('subTitle')
              t.string('title')
              t.boolean('displayLogo')
              t.field('textTheme', { type: 'ThemeMode' })

              t.field('drawerMode', { type: 'DrawerMode' })
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        // const apps = await ctx.db.app.findMany()
        // await Promise.all(
        //   apps.map(async ({ id }) => {
        //     await ctx.db.app.update({
        //       where: { id },
        //       //@ts-ignore
        //       data: {
        //         design: {
        //           create: {
        //             AppDesignDrawer: { create: {} },
        //           },
        //         },
        //       },
        //     })
        //   }),
        // )

        // let { ...} = args.data
        return await ctx.db.appDesignDrawer.update({
          where: { appId: args.id },
          //@ts-ignore
          data: {
            ...args.data,
          },
        })
      },
    })
    t.field('deleteApp', {
      type: 'App',
      args: {
        id: nonNull(intArg()),
      },

      async resolve(_root, args, ctx) {
        return await ctx.db.app.delete({
          where: { id: args.id },
        })
      },
    })
  },
})
export const LinkQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.links({ filtering: true, ordering: true, pagination: true })
    t.field('links', {
      type: objectType({
        name: 'linkConnectionPayLoad',
        definition(t) {
          t.int('count')
          t.list.field('nodes', { type: 'Link' })
        },
      }),
      args: {
        skip: intArg(),
        take: intArg(),
        appId: nonNull(intArg()),

        orderBy: 'LinkOrderByWithRelationInput',
        where: 'LinkWhereInput',
      },
      async resolve(source, args, ctx) {
        const { appId, ...rest } = args
        // if (
        //   !(await ctx.db.app.count({
        //     where: {
        //       OR: [
        //         { owner: { builder: { ownerId: ctx.user.id } } },
        //         { ownerId: ctx.user.id },
        //       ],
        //       id: appId,
        //     },
        //   }))
        // )
        //   throw new Error('must be the owner of the app')
        //@ts-ignore
        rest.where = { ...args.where, appid: { equals: appId } }

        return {
          //@ts-ignore
          count: await ctx.db.link.count({ where: rest.where }),
          //@ts-ignore

          nodes: await ctx.db.link.findMany(rest),
        }
      },
    })
  },
})

export const Linkmutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('addLink', {
      type: 'Link',
      args: {
        data: arg({
          type: inputObjectType({
            name: 'addLinkInput',
            definition(t) {
              t.nonNull.string('name')
              t.string('icon')
              t.nonNull.int('appId')
              t.nonNull.field('type', { type: 'LinkType' })
              t.nonNull.field('menuType', { type: 'MenuType' })
              t.json('data')
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        let { name, type, data, menuType, appId, icon } = args.data
        if (
          !(await ctx.db.app.count({
            where: {
              OR: [
                { owner: { builder: { ownerId: ctx.user.id } } },
                { ownerId: ctx.user.id },
              ],
              id: appId,
            },
          }))
        )
          throw new Error('must be the owner of the app')

        return await ctx.db.link.create({
          data: {
            name,
            data,
            type,
            menuType,
            icon,
            app: { connect: { id: appId } },
          },
        })
      },
    })
    t.field('updateLink', {
      type: 'Link',
      args: {
        id: nonNull(intArg()),
        data: arg({
          type: inputObjectType({
            name: 'updateLinkInput',
            definition(t) {
              t.string('name')
              t.field('type', { type: 'LinkType' })
              t.json('data')
              t.string('icon')
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        let { name, type, data, icon } = args.data
        return await ctx.db.link.update({
          where: { id: args.id },
          data: {
            name: name ?? undefined,
            data,
            icon,
            type: type ?? undefined,
          },
        })
      },
    })
    t.field('deleteLink', {
      type: 'Link',
      args: {
        id: nonNull(intArg()),
      },

      async resolve(_root, args, ctx) {
        return await ctx.db.link.delete({
          where: { id: args.id },
        })
      },
    })
  },
})
