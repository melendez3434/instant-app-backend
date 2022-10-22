import {
  arg,
  enumType,
  extendType,
  inputObjectType,
  intArg,
  nonNull,
  objectType,
} from 'nexus'

export const App = objectType({
  name: 'App',
  definition(t) {
    t.model.id()
    t.model.name()
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
            where: { ownerId: ctx.user.id, id: appId },
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
