import { rule } from 'graphql-shield'
import { Context } from '../utils/context'

export const isSuperAdmin = rule({
  cache: 'contextual',
})(async (parent, args, ctx, info) => {
  return ctx.user && ctx.user.role == 'superAdmin'
})

export const isAdmin = rule({
  cache: 'contextual',
})(async (parent, args, ctx: Context, info) => {
  return ctx.user && ctx.user.role == 'admin'
})

export const isAuth = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    console.log('🚀 ~ file: rules.ts ~ line 28 ~ ctx.user', ctx.user)

    return Boolean(ctx.user)
  },
)
export const notBreakPagination = rule({ cache: 'strict' })(
  async (parent, args, ctx, info) => {
    if (isNaN(args.take)) {
      throw new Error('you must specify take arg')
    }

    if (!(args.take <= 100)) {
      throw new Error("you can't get more than 100")
    }

    return true
  },
)
export const isAppOwner = rule({ cache: 'strict' })(
  async (parent, args, ctx: Context, info) => {
    if (!ctx.user?.id) return false

    if (
      await ctx.db.app.count({
        where: {
          id: args.appId || args.id,
          OR: [
            { owner: { builder: { ownerId: ctx.user.id } } },
            { ownerId: ctx.user.id },
          ],
        },
      })
    ) {
      return true
    } else {
      return false
    }
  },
)
export const isNotificationOwner = rule({ cache: 'strict' })(
  async (parent, args, ctx: Context, info) => {
    if (!ctx.user?.id) return false

    if (
      await ctx.db.notification.count({
        where: {
          id: args.id,
          App: {
            OR: [
              { owner: { builder: { ownerId: ctx.user.id } } },
              { ownerId: ctx.user.id },
            ],
          },
        },
      })
    ) {
      return true
    } else {
      return false
    }
  },
)

export const isAppOwnerFromLink = rule({ cache: 'strict' })(
  async (parent, args, ctx: Context, info) => {
    if (
      await ctx.db.link.count({
        where: {
          app: {
            OR: [
              { owner: { builder: { ownerId: ctx.user.id } } },
              { ownerId: ctx.user.id },
            ],
          },
          id: args.id,
        },
      })
    ) {
      return true
    } else {
      return false
    }
  },
)

export const isHaveRole = (role, resolverName) =>
  rule({ cache: 'contextual' })(async (parent, args, ctx: Context, info) => {
    if (role?.includes('all')) return true
    if (!ctx.user?.id) return false
    const user = await ctx.db.user.findFirst({
      where: {
        id: ctx.user?.id,
      },
      select: { role: true },
    })

    if (role?.includes(user?.role)) return true

    return false
  })
