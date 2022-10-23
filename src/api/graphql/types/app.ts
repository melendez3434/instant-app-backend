import {
  arg,
  extendType,
  inputObjectType,
  intArg,
  nonNull,
  objectType,
} from 'nexus'
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
    t.model.disblayLogo()
    t.model.tagLine()
    t.model.delay()
    t.model.backgroundImage()
    t.model.createdAt()
  },
})
export const Link = objectType({
  name: 'Link',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.data()
    t.model.type()
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
        const { where, ...rest } = args
        args.where = { ...args.where, ownerId: { equals: ctx.user.id } }

        return {
          //@ts-ignore
          count: await ctx.db.app.count({ where: rest.where }),
          //@ts-ignore

          nodes: await ctx.db.app.findMany(rest),
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
            assets: { create: { disblayLogo: true, color: '#000' } },
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
              t.boolean('disblayLogo')
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
        let { name, type, data, menuType, appId } = args.data
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
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        let { name, type, data } = args.data
        return await ctx.db.link.update({
          where: { id: args.id },
          data: {
            name: name || undefined,
            data,
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
