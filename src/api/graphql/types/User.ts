import { arg, extendType, inputObjectType, intArg, objectType } from 'nexus'
import hashPassword from '../../utils/hashPassword'

export const User = objectType({
  name: 'User',
  definition(t) {
    t.model.id()
    t.model.email()

    t.model.password()

    t.model.role()

    t.model.createdAt()
    t.model.updatedAt()
  },
})

export const UserQuery = extendType({
  type: 'Query',
  definition(t) {
    // t.crud.user()
    // t.field('user', {
    //   type: 'User',
    //   args: {
    //     where: arg({ type: 'UserWhereInput', required: true }),
    //   },
    //   async resolve(source, args, ctx) {
    //     args.where = {
    //       ...args.where,
    //     }

    //     return await ctx.db.user.findFirst(args)
    //   },
    // })
    t.crud.users({ filtering: true, ordering: true, pagination: true })
    t.field('users', {
      type: objectType({
        name: 'userConnectionPayLoad',
        definition(t) {
          t.int('count')
          t.list.field('nodes', { type: 'User' })
        },
      }),
      args: {
        skip: intArg(),
        take: intArg(),
        orderBy: 'UserOrderByWithRelationInput',
        where: 'UserWhereInput',
      },
      async resolve(source, args, ctx) {
        return {
          //@ts-ignore
          count: await ctx.db.user.count({ where: args.where }),
          //@ts-ignore

          nodes: await ctx.db.user.findMany(args),
        }
      },
    })
  },
})

export const Usermutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateMyProfile', {
      type: 'User',
      args: {
        data: arg({
          type: inputObjectType({
            name: 'updateMyProfileInput',
            definition(t) {
              t.string('newPass')
              t.string('email')
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        const { data } = args
        let { email, newPass, ...rest } = data

        const isEmailExist =
          email &&
          (await ctx.db.user.findFirst({
            where: {
              email,
              id: { not: { equals: ctx.user?.id } },
            },
          }))
        if (
          isEmailExist
          //  && ctx.user?.id !== isEmailExist?.id
        ) {
          throw new Error('sorry but there is a user already have this email')
        }
        const password = newPass ? await hashPassword(newPass) : undefined
        const user = await ctx.db.user.update({
          where: { id: ctx.user?.id },
          data: {
            ...rest,
            password,
            email: email || undefined,
          },
        })
        return user
      },
    })
  },
})
