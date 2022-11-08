import {
  arg,
  extendType,
  inputObjectType,
  intArg,
  nonNull,
  objectType,
} from 'nexus'
var url = require('url')
var cmd = require('node-cmd')

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
    t.model.design()
  },
})

export const AppBuild = objectType({
  name: 'AppBuild',
  definition(t) {
    t.model.id()
    t.model.appBuildVersion()
    t.model.appVersion()
    t.model.data()
    t.model.platform()
    t.model.status()
    t.model.createdAt()
    t.model.updatedAt()
    t.model.url()
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
    t.crud.appBuilds({ filtering: true, ordering: true, pagination: true })

    t.field('appBuilds', {
      type: objectType({
        name: 'AppBuildsConnectionPayLoad',
        definition(t) {
          t.int('count')
          t.list.field('nodes', { type: 'AppBuild' })
        },
      }),
      args: {
        skip: intArg(),
        take: intArg(),
        orderBy: 'AppBuildOrderByWithRelationInput',
        where: 'AppBuildWhereInput',
      },
      async resolve(source, args, ctx) {
        args.where = {
          ...args.where,
          App: { ownerId: { equals: ctx.user.id } },
        }

        return {
          //@ts-ignore
          count: await ctx.db.appBuild.count({ where: args.where }),
          //@ts-ignore

          nodes: await ctx.db.appBuild.findMany(args),
        }
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

        return await ctx.db.app.create({
          data: {
            name,
            website,
            lang: 'EN',
            appId: url.parse(website).hostname.split('.').reverse().join('.'),
            assets: { create: { displayLogo: true, color: '#000' } },
            design: { create: { AppDesignDrawer: { create: {} } } },

            owner: { connect: { id: ctx.user.id } },
          },
        })
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
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        let { name, website, appId, lang, userAgent } = args.data
        return await ctx.db.app.update({
          where: { id: args.id },
          data: {
            name: name || undefined,
            website: website || undefined,
            appId: appId || undefined,
            lang: lang || undefined,
            userAgent,
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
            activeTabColor: args.data.activeTabColor || undefined,
            themeColor: args.data.themeColor || undefined,
            titleTheme: args.data.titleTheme || undefined,
            disblayPagetitle: args.data.disblayPagetitle || undefined,
            layoutTemplate: args.data.layoutTemplate || undefined,
            progressIndicator: args.data.progressIndicator || undefined,
            pullToRefresh: args.data.pullToRefresh || undefined,
            progressIndicatorColor:
              args.data.progressIndicatorColor || undefined,
            navigationActiveColor: args.data.navigationActiveColor || undefined,
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
    t.field('generateBuild', {
      type: 'AppBuild',
      args: {
        id: nonNull(intArg()),
        platform: nonNull(arg({ type: 'AppBuildPlatform' })),
      },

      async resolve(_root, { id, platform }, ctx) {
        const AppBuild = await ctx.db.appBuild.create({
          data: {
            App: { connect: { id } },
            platform,
          },
        })
        cmd.run(
          `
          npx  expo logout
          npx  expo login -u instantappbuilder -p instantappbuilder
          `,
          async function (err, authData, stderr) {
            console.log('🚀 ~ file: app.ts ~ line 378 ~ authData', authData)
            cmd.run(
              `
              cd ./src/api/app-instant
              npx eas build --platform ${platform}  --json  --non-interactive
            
              `,
              async function (err, data, stderr) {
                if (err) {
                  return await ctx.db.appBuild.update({
                    where: { id: AppBuild.id },
                    data: {
                      data: JSON.stringify({ err, data, stderr }),
                      status: 'failed',
                    },
                  })
                }
                console.log('🚀 ~ file: app.ts ~ line 385 ~ stderr', stderr)
                console.log('🚀 ~ file: app.ts ~ line 385 ~ err', err)
                console.log('🚀 ~ file: app.ts ~ line 385 ~ data', data)
                try {
                  const [buildData] = JSON.parse(data)
                  console.log(
                    '🚀 ~ file: app.ts ~ line 379 ~ buildData',
                    buildData,
                  )

                  await ctx.db.appBuild.update({
                    where: { id: AppBuild.id },
                    data: {
                      data: buildData,
                      appVersion: buildData.appVersion,
                      appBuildVersion: Number(buildData.appBuildVersion),
                      status:
                        buildData.status == 'FINISHED' ? 'success' : 'failed',
                      url: buildData.artifacts.buildUrl,
                    },
                  })
                } catch (error) {
                  console.log('🚀 ~ file: app.ts ~ line 395 ~ error', error)
                  await ctx.db.appBuild.update({
                    where: { id: AppBuild.id },
                    data: {
                      data: JSON.stringify({ error }),
                      status: 'failed',
                    },
                  })
                }
              },
            )
          },
        )

        return AppBuild
        // [
        //   {
        //     "id": "ae02af84-0a96-49ba-b2b2-32d0f6da3f8d",
        //     "status": "FINISHED",
        //     "platform": "ANDROID",
        //     "artifacts": {
        //       "buildUrl": "https://expo.dev/artifacts/eas/nuh9gtG7vvynUxjgNUW6JD.aab"
        //     },
        //     "initiatingActor": {
        //       "id": "3d1eec45-9fd9-44cd-bad8-2be28c30f0e5",
        //       "displayName": "b7r"
        //     },
        //     "project": {
        //       "id": "4d3729d9-8b68-4c6b-bf4a-f5363ec96c2c",
        //       "name": "app-builder",
        //       "ownerAccount": {
        //         "id": "e7dd7ccb-1884-4637-8c92-50c7ece7d2e8",
        //         "name": "b7r"
        //       }
        //     },
        //     "distribution": "STORE",
        //     "buildProfile": "production",
        //     "sdkVersion": "46.0.0",
        //     "appVersion": "1.0.0",
        //     "appBuildVersion": "1",
        //     "gitCommitHash": "eefb1bc1d01d765e57b84a56c9e291ac68d13b66",
        //     "createdAt": "2022-11-07T07:07:03.451Z",
        //     "updatedAt": "2022-11-07T07:13:50.983Z"
        //   }
        // ]
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
        if (
          !(await ctx.db.app.count({
            where: { ownerId: ctx.user.id, id: appId },
          }))
        )
          throw new Error('must be the owner of the app')

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
            where: { ownerId: { equals: ctx.user.id }, id: appId },
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
            name: name || undefined,
            data,
            icon,
            type: type || undefined,
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
