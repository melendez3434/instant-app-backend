import {
  arg,
  extendType,
  inputObjectType,
  intArg,
  nonNull,
  objectType,
} from 'nexus'
import hashPassword from '../../utils/hashPassword'
import * as bcrypt from 'bcryptjs'
import isEmail from 'validator/lib/isEmail'

export const User = objectType({
  name: 'User',
  definition(t) {
    t.model.id()
    t.model.email()

    t.model.password()
    t.model.role()
    t.int('appsCount', {
      async resolve({ id }, args, ctx) {
        return await ctx.db.app.count({ where: { ownerId: id } })
      },
    })
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
    t.field('myUsers', {
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
      }, //@ts-ignore
      async resolve(source, args, ctx) {
        args.where = {
          ...args.where,
          builderDomain: { equals: ctx.builderDomain },
          role: { equals: 'user' },
        }

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
              t.string('pass')
              t.string('newPass')
              t.string('email')
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        const { data } = args
        let { email, pass, newPass, ...rest } = data
        if (email && !isEmail(email))
          throw new Error('The Email field must contain a valid email address.')

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

        if (pass && newPass) {
          const user = await ctx.db.user.findUnique({
            where: {
              id: ctx.user?.id,
            },
          })
          if (!user) throw new Error('no user with this id')
          const isOldPlass = await bcrypt.compare(pass, user.password)
          if (!isOldPlass) throw new Error(`old password is Wrong`)

          // 4. Hash their new password
          const password = await hashPassword(newPass)
          // 5. Save the new password to the user and remove old resetToken fields
          const updatedUser = await ctx.db.user.update({
            where: { id: ctx.user?.id },
            data: {
              password,
            },
          })
        }

        const user = await ctx.db.user.update({
          where: { id: ctx.user?.id },
          data: {
            ...rest,
            email: email ?? undefined,
          },
        })
        return user
      },
    })
    t.field('deleteUser', {
      type: 'User',
      args: {
        id: nonNull(intArg()),
      },

      async resolve(_root, args, ctx) {
        return await ctx.db.user.delete({
          where: { id: args.id },
        })
      },
    })
  },
})
