// @ts-nocheck

import {
  arg,
  enumType,
  extendType,
  inputObjectType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from 'nexus'
import hashPassword from '../../utils/hashPassword'
import * as bcrypt from 'bcryptjs'
import { upsertTags } from './Product/utils'
import { delUserLogFromRedis } from '../../utils/redis'
import { updateCustomerInZoho } from '../../utils/zohoCrm'

export const User = objectType({
  name: 'User',
  definition(t) {
    // t.string("id")
    t.model.id()
    t.model.email()
    t.model.name()
    t.model.phone()
    t.model.phonePrefix()
    t.model.password()
    t.model.avatar()
    t.model.branchCacherId()
    t.model.shopDomain()
    t.model.role()
    t.model.addresses({ filtering: true })
    t.model.cart()
    t.model.orders()
    t.model.stripeCustomerId()
    t.model.notificationToken()
    t.model.wishList()
    t.model.note()
    t.model.B7rAffiliate()
    t.model.status()

    // t.model.store()
    t.model.permissions()
    t.model.shop()
    t.model.createdAt()
    t.model.updatedAt()
    // t.field('balance', {
    //   type: 'Float',
    //   async resolve({ id }, args, ctx) {
    //     const allBalanceInvoices =
    //       (
    //         await ctx.db.invoice.aggregate({
    //           where: {
    //             userId: id,
    //             status: 'PAID',
    //             type: 'ADD_TO_BALANCE',
    //           },
    //           _sum: { value: true },
    //         })
    //       )?._sum?.value || 0
    //     const allInvoices =
    //       (
    //         await ctx.db.invoice.aggregate({
    //           where: {
    //             userId: id,
    //             status: 'PAID',
    //             method: 'BALANCE',
    //             type: { not: 'ADD_TO_BALANCE' },
    //           },
    //           _sum: { value: true },
    //         })
    //       )?._sum?.value || 0
    //     return Number(allBalanceInvoices - allInvoices)
    //   },
    // })
    t.nullable.field('storeModeratedCount', {
      type: 'Int',
      async resolve({ id }, args, ctx) {
        return await ctx.db.store.count({
          where: {
            moderatorId: id,
          },
        })
      },
    })
    t.nullable.field('visitsCount', {
      type: 'Int',
      async resolve({ id }, args, ctx) {
        return await ctx.db.session.count({
          where: {
            userId: id,
          },
        })
      },
    })
    t.nullable.field('lastVisit', {
      type: 'DateTime',
      async resolve({ shopDomain, id }, args, ctx) {
        return (
          await ctx.db.session.findFirst({
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            where: {
              userId: id,
            },
          })
        )?.createdAt
      },
    })
    t.nullable.field('ordersCount', {
      type: 'Int',
      async resolve({ shopDomain, id }, args, ctx) {
        return await ctx.db.order.count({
          where: {
            ownerId: id,
            // status: { not: 'ARCHIVED' },
            status: 'COMPLETED',
          },
        })
      },
    })
    t.nullable.field('cancelledOrdersCount', {
      type: 'Int',
      async resolve({ shopDomain, id }, args, ctx) {
        return await ctx.db.order.count({
          where: {
            ownerId: id,
            // status: { not: 'ARCHIVED' },
            status: 'CANCELED',
          },
        })
      },
    })
    t.nullable.field('avgOrderVal', {
      type: 'Float',
      async resolve({ shopDomain, id }, args, ctx) {
        return (
          (
            await ctx.db.order.aggregate({
              _avg: { total: true },
              where: {
                ownerId: id,
                // status: { not: 'ARCHIVED' },
                status: 'COMPLETED',
              },
            })
          )?._avg?.total?.toFixed(2) || 0
        )
      },
    })
    t.nullable.field('totalOrders', {
      type: 'Float',
      async resolve({ shopDomain, id }, args, ctx) {
        return (
          (
            await ctx.db.order.aggregate({
              _sum: { total: true },
              where: {
                ownerId: id,
                // status: { not: 'ARCHIVED' },
                status: 'COMPLETED',
              },
            })
          )?._sum?.total?.toFixed(2) || 0
        )
      },
    })
    t.nullable.field('currentShop', {
      type: 'Store',
      async resolve({ shopDomain }, args, ctx) {
        console.log(
          '🚀 ~ file: User.ts ~ line 43 ~ resolve ~ shopDomain',
          shopDomain,
        )
        console.log(
          '🚀 ~ file: User.ts ~ line 46 ~ resolve ~ ctx.host',
          ctx.host,
        )

        return (
          (await ctx.db.store.findFirst({
            where: { domain: ctx.host, userId: ctx?.user?.id },
          })) ||
          (shopDomain
            ? await ctx.db.store.findFirst({
                where: { domain: shopDomain },
              })
            : null)
        )
      },
    })
    t.model.store({ alias: 'stores' })

    t.model.tags()
    t.model.history({ ordering: true })
  },
})
export const HistoryItem = objectType({
  name: 'HistoryItem',
  definition(t) {
    // t.string("id")
    t.model.id()
    t.model.product()
    t.model.productId()
    t.model.updatedAt()
    t.model.user()
    t.model.userId()
  },
})
export const UserQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.user()
    t.field('user', {
      type: 'User',
      args: {
        where: arg({ type: 'UserWhereInput', required: true }),
      },
      async resolve(source, args, ctx) {
        args.where = {
          ...args.where,
          OR: [
            {
              store: { some: { domain: { equals: ctx.host } } },
            },
            {
              shop: { domain: { equals: ctx.host } },
            },
          ],
        }

        return await ctx.db.user.findFirst(args)
      },
    })
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
        args.where = { ...args.where, shop: { domain: { equals: ctx.host } } }

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
    t.field('addUser', {
      type: 'User',
      args: {
        data: nonNull(
          arg({
            type: inputObjectType({
              name: 'AddUserInput',
              definition(t) {
                t.string('email')
                t.string('phone')
                t.string('phonePrefix')

                t.string('password')
                t.string('name')
                t.string('note')

                t.list.nonNull.string('tags'),
                  t.field({
                    type: enumType({
                      members: ['CUSTOMER', 'CUSTOM'],
                      name: 'AddUserRole',
                    }),
                    name: 'role',
                  })
                t.list.string('permissions')
              },
            }),
          }),
        ),
      },

      async resolve(_root, args, ctx) {
        const { data } = args
        let { email, password, phone, tags, ...rest } = data
        const upsertedTags = await upsertTags(
          tags,
          ctx,
          data.role == 'CUSTOMER' ? 'CUSTOMER' : 'USER',
        )

        // lowercase their email
        email = email?.toLowerCase()

        const isEmailExist =
          email &&
          (await ctx.db.user.findFirst({
            where: {
              email: { equals: email, mode: 'insensitive' },
              shop: { domain: ctx.host },
            },
          }))
        if (isEmailExist) {
          throw new Error('sorry but this email already exist')
        }
        const isPhoneExist =
          phone &&
          (await ctx.db.user.findFirst({
            where: { phone, shop: { domain: ctx.host } },
          }))
        if (isPhoneExist) {
          throw new Error('sorry but this phone already exist')
        }
        const hash = await hashPassword(password)

        return ctx.db.user.create({
          data: {
            ...rest,
            phone,
            email,
            tags: upsertedTags
              ? { connect: upsertedTags?.map((tag) => ({ id: tag.id })) }
              : undefined,
            shop: { connect: { domain: ctx.host } },
            password: hash,
          },
        })
      },
    })
    t.crud.deleteOneUser({
      async resolve(_root, args, ctx) {
        const { where } = args
        const user = await ctx.db.user.findFirst({
          where: {
            shop: { domain: ctx.host },
            id: { equals: where?.id || 0 },
          },
        })
        delUserLogFromRedis(where.id)

        if (!user) throw new Error("can't")

        return ctx.db.user.delete({
          where: { id: where.id || 0 },
        })
      },
    })
    t.field('deleteManyUser', {
      type: 'Int',
      args: {
        ids: nonNull(list(nonNull(intArg()))),
      },
      async resolve(_root, args, ctx) {
        const { ids } = args
        return (
          await ctx.db.user.deleteMany({
            where: {
              shop: { domain: ctx.host },
              id: { in: ids },
            },
          })
        ).count
      },
    })
    t.field('updateUser', {
      type: 'User',
      args: {
        where: arg({ type: 'UserWhereUniqueInput' }),
        data: arg({
          type: inputObjectType({
            name: 'UpdateUserInput',
            definition(t) {
              t.string('name')
              t.string('email')
              t.string('phone')
              t.string('phonePrefix')
              t.string('note')
              t.string('password')
              t.field('role', { type: 'AddUserRole' })
              t.list.string('permissions')
              t.field('avatar', { type: 'ImageInput' })
              t.list.nonNull.string('tags')
              t.field('address', { type: 'addressInput' })
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        const { where, data } = args
        let { email, avatar, password, phone, tags, address, ...rest } = data
        console.log('🚀 ~ file: User.ts ~ line 352 ~ resolve ~ phone', phone)
        console.log('🚀 ~ file: User.ts ~ line 352 ~ resolve ~ rest', rest)
        delUserLogFromRedis(where.id)

        const upsertedTags = await upsertTags(tags, ctx, 'CUSTOMER')

        // lowercase their email
        email = email?.toLowerCase()

        const isEmailExist =
          email &&
          (await ctx.db.user.findFirst({
            where: {
              email,
              shop: { domain: ctx.host },
              id: { not: { equals: where.id } },
            },
          }))
        if (
          isEmailExist
          //  && where.id !== isEmailExist?.id
        ) {
          throw new Error('sorry but there is a user already have this email')
        }
        const isPhoneExist =
          phone &&
          (await ctx.db.user.findFirst({
            where: {
              phone,
              shop: { domain: ctx.host },
              id: { not: { equals: where.id } },
            },
          }))
        if (
          isPhoneExist
          //  && where.id !== isPhoneExist?.id
        ) {
          throw new Error('sorry but there is a user already have this phone')
        }
        const hash = password ? await hashPassword(password) : undefined

        return ctx.db.user.update({
          where: where || { id: ctx.user?.id },

          data: {
            ...rest,
            password: hash,
            phone: phone == '' ? null : phone,
            email: email == '' ? null : email,
            tags: upsertedTags
              ? { set: upsertedTags?.map((tag) => ({ id: tag.id })) }
              : undefined,
            avatar: avatar ? { update: avatar } : undefined,
            addresses: address
              ? {
                  upsert: {
                    where: { id: address.id || 0 },
                    create: {
                      ...address,
                      id: undefined,
                      country: address.country
                        ? { connect: { name: address.country } }
                        : undefined,

                      default: true,
                      extraFields: {
                        create: address?.extraFields.map(({ id, value }) => ({
                          extraField: { connect: { id } },
                          value,
                        })),
                      },
                    },
                    update: {
                      ...address,
                      id: undefined,
                      extraFields: {
                        upsert: address?.extraFields.map(
                          ({ id: extraFieldId, value }) => ({
                            where: {
                              addressId_extraFieldId: {
                                addressId: address.id,
                                extraFieldId,
                              },
                            },
                            create: {
                              extraField: { connect: { id: extraFieldId } },
                              value,
                            },
                            update: {
                              value,
                            },
                          }),
                        ),
                      },
                      country: address.country
                        ? { connect: { name: address.country } }
                        : undefined,
                    },
                  },
                }
              : undefined,
          },
        })
      },
    })

    t.field('addCustomer', {
      type: 'User',
      args: {
        address: arg({
          type: 'addressInput',
          required: true,
        }),
        name: stringArg({ required: true }),
        email: stringArg({ required: true }),

        password: stringArg({ required: true }),
      },

      async resolve(_root, args, ctx) {
        let { email, name, address, password } = args
        // lowercase their email
        console.log(
          '🚀 ~ file: User.ts ~ line 294 ~ resolve ~ ctx.host',
          ctx.host,
        )

        if (password.length < 8)
          throw new Error('password must be more than 8 characters')

        email = email?.toLowerCase()

        const isEmailExist =
          email &&
          (await ctx.db.user.findFirst({
            where: {
              email: { equals: email, mode: 'insensitive' },
              shop: { domain: ctx.host },
            },
          }))
        if (isEmailExist) {
          throw new Error('sorry but this email already exist')
        }
        // hash their password
        const hash = await hashPassword(password)
        return ctx.db.user.create({
          data: {
            name,
            email,
            password: hash,
            role: 'CUSTOMER',
            shop: { connect: { domain: ctx.host } },
            addresses: {
              create: [
                {
                  ...address,
                  extraFields: {
                    create: address?.extraFields.map(({ id, value }) => ({
                      extraField: { connect: { id } },
                      value,
                    })),
                  },
                  country: address.country
                    ? { connect: { name: address.country } }
                    : undefined,

                  default: true,
                },
              ],
            },
          },
        })
      },
    }),
      // t.field('editProfile', {
      //   type: 'User',
      //   args: {
      //     where: arg({ type: 'UserWhereUniqueInput' }),
      //     data: arg({
      //       type: 'UpdateUserInput',
      //       required: true,
      //     }),
      //   },

      //   async resolve(_root, args, ctx) {
      //     const { where, data } = args
      //     let { email, name, avatar, phone, ...rest } = data
      //     delUserLogFromRedis(where.id)

      //     // lowercase their email
      //     email = email?.toLowerCase()
      //     name = name?.toLowerCase()

      //     const isEmailExist =
      //       email &&
      //       (await ctx.db.user.findFirst({
      //         where: {
      //           email,
      //           id: { not: { equals: where.id } },
      //           OR: [{ shopDomain: ctx.host }, { role: 'VENDOR' }],
      //         },
      //       }))
      //     if (
      //       isEmailExist
      //       //  && where.id !== isEmailExist?.id
      //     ) {
      //       // throw new Error('sorry but this email already exist')
      //       throw new Error('sorry but there is a user already have this email')
      //     }
      //     const isPhoneExist =
      //       phone &&
      //       (await ctx.db.user.findFirst({
      //         where: {
      //           phone,
      //           OR: [{ shop: { domain: ctx.host } }, { role: 'VENDOR' }],
      //           id: { not: { equals: where.id } },
      //         },
      //       }))
      //     if (
      //       isPhoneExist
      //       //  && where.id !== isPhoneExist?.id
      //     ) {
      //       // throw new Error('sorry but this phone already exist')
      //       throw new Error('sorry but there is a user already have this phone')
      //     }
      //     return ctx.db.user.update({
      //       where: where || { id: ctx.user?.id },

      //       data: {
      //         ...rest,
      //         phone,
      //         name,
      //         email,
      //         avatar: avatar ? { update: avatar } : undefined,
      //       },
      //     })
      //   },
      // })

      t.field('updateMyProfile', {
        type: 'User',
        args: {
          data: arg({
            type: inputObjectType({
              name: 'updateMyProfileInput',
              definition(t) {
                t.string('name')
                t.string('email')
                t.string('phone')
                t.string('notificationToken')
                t.string('phonePrefix')

                t.field('avatar', { type: 'ImageInput' })
              },
            }),
            required: true,
          }),
        },

        async resolve(_root, args, ctx) {
          const { data } = args
          let { email, name, avatar, phone, ...rest } = data
          console.log('resolve -> avatar', avatar)
          delUserLogFromRedis(ctx.user.id).catch((err) => {
            console.log('🚀 ~ file: Domain.ts ~ line 337 ~ resolve ~ err', err)
          })
          const me = await ctx.prisma.user.findUnique({
            where: { id: ctx.user.id },
            include: { shop: true },
          })

          const isEmailExist =
            email &&
            (await ctx.db.user.findFirst({
              where: {
                email,
                OR:
                  me?.role == 'VENDOR'
                    ? [{ shopDomain: me?.shopDomain }, { role: 'VENDOR' }]
                    : [{ shopDomain: me?.shopDomain }],
                id: { not: { equals: ctx.user?.id } },
              },
            }))
          if (
            isEmailExist
            //  && ctx.user?.id !== isEmailExist?.id
          ) {
            throw new Error('sorry but there is a user already have this email')
          }
          const isPhoneExist =
            phone &&
            (await ctx.db.user.findFirst({
              where: {
                phone,
                OR:
                  me?.role == 'VENDOR'
                    ? [{ shopDomain: me?.shopDomain }, { role: 'VENDOR' }]
                    : [{ shopDomain: me?.shopDomain }],
                id: { not: { equals: ctx.user?.id } },
              },
            }))
          if (
            isPhoneExist
            //  && ctx.user?.id !== isPhoneExist?.id
          ) {
            throw new Error('sorry but there is a user already have this phone')
          }

          const user = await ctx.db.user.update({
            where: { id: ctx.user?.id },

            data: {
              ...rest,
              phone,
              name,
              email,
              avatar: avatar ? { create: avatar } : undefined,
            },
          })

          updateCustomerInZoho(user, ctx).catch((err) => {
            console.log('🚀 ~ file: User.ts ~ line 675 ~ resolve ~ err', err)
          })
          return user
        },
      })

    t.field('changeMyPassword', {
      type: 'User',
      args: {
        oldPass: stringArg({ required: true }),
        newPass: stringArg({ required: true }),
      },
      async resolve(_root, { oldPass, newPass }, ctx) {
        const user = await ctx.db.user.findUnique({
          where: {
            id: ctx.user?.id,
          },
        })
        if (!user) throw new Error('no user with this id')
        const isOldPlass = await bcrypt.compare(oldPass, user.password)
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

        // 8. return the new user
        return updatedUser
      },
    })
  },
})
