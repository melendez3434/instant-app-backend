import * as bcrypt from 'bcryptjs'
import hashPassword from '../../../utils/hashPassword'
import {
  arg,
  enumType,
  mutationType,
  nonNull,
  objectType,
  stringArg,
} from 'nexus'

import isEmail from 'validator/lib/isEmail'

function randomString(length, chars) {
  var mask = ''
  if (chars.indexOf('#') > -1) mask += '0123456789'
  var result = ''
  for (var i = length; i > 0; --i)
    result += mask[Math.floor(Math.random() * mask.length)]
  return result
}

export const Mutation = mutationType({
  definition(t) {
    t.field('signup', {
      type: 'AuthPayLoad',
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      async resolve(_root, args, ctx) {
        const { email, password } = args
        console.log('🚀 ~ file: auth.ts ~ line 35 ~ resolve ~ args', args)
        // lowercase their email
        email.toLowerCase()

        if (password.length < 8)
          throw new Error('password must be more than 8 characters')

        const isEmailExist = await ctx.db.user.findFirst({
          where: {
            email: { equals: email, mode: 'insensitive' },
          },
        })

        if (isEmailExist) {
          throw new Error('sorry but this email are already exist')
        }
        // hash their password
        const hash = await hashPassword(password)
        // create the user in the database
        const admin = await ctx.db.user.create({
          data: {
            ...args,
            password: hash,
            role: 'user',
          },
        })
        const token = ctx.auth.signInWithJWT(admin)

        return { user: admin, token }
      },
    }),
      t.field('signin', {
        type: objectType({
          name: 'AuthPayLoad',
          definition(t) {
            t.field('user', { type: 'User' })
            t.string('token')
          },
        }),
        args: {
          emailOrPhone: nonNull(stringArg()),
          password: nonNull(stringArg()),
        },
        async resolve(_root, args, ctx) {
          const {
            emailOrPhone,
            password,
            //  type
          } = args
          let phone, email
          if (isEmail(emailOrPhone)) {
            email = emailOrPhone
          } else {
            phone = emailOrPhone
          }
          if (email && phone)
            throw new Error('you must provide email or phone not both')

          if (!email && !phone)
            throw new Error('you must provide email or phone')
          // await ctx.db.user.updateMany({
          //   where: { email },
          //   data: { role: 'CUSTOMER' },
          // })
          // lowercase their email

          const isEmailExist = await ctx.db.user.findFirst({
            where: {
              email: email ? { equals: email, mode: 'insensitive' } : undefined,
            },
          })

          if (!isEmailExist) {
            throw new Error('sorry but you are not exist')
          }
          const valid = await bcrypt.compare(password, isEmailExist.password)
          if (!valid) {
            throw new Error('Invalid Password!')
          }
          const token = ctx.auth.signInWithJWT(
            isEmailExist,
            // isEmailExist.shopDomain,
            // ctx.host == 'www.b7r.store' ? 'admin.myb7r.store' : null,
          )

          return { user: isEmailExist, token }
        },
      }),
      t.field('signOut', {
        type: 'String',
        async resolve(_root, args, ctx) {
          ctx.auth.logout()

          return 'Goodbye!'
        },
      })
    //   t.field('requestReset', {
    //     type: 'String',
    //     args: {
    //       type: arg({
    //         type: enumType({
    //           members: ['customer', 'vendor'],
    //           name: 'userType',
    //         }),
    //         default: 'customer',
    //       }),
    //       email: stringArg(),
    //       phone: stringArg(),
    //     },
    //     //@ts-ignore
    //     async resolve(_root, { email, phone, type }, ctx) {
    //       if (email && phone)
    //         throw new Error('you must provide email or phone not both')

    //       if (!email && !phone)
    //         throw new Error('you must provide email or phone')

    //       // 1. Check if this is a real user
    //       if (email) {
    //         const user = await ctx.db.user.findFirst({
    //           select: { id: true },
    //           where: {
    //             email: { equals: email, mode: 'insensitive' },
    //           },
    //         })

    //         if (!user) {
    //           return new Error(`No such user found for email ${email}`)
    //         }
    //         // 2. Set a reset token and expiry on that user
    //         // const randomBytesPromiseified = promisify(randomBytes)
    //         const resetToken = randomString(4, '#')
    //         //  (await randomBytesPromiseified(20)).toString(
    //         //   'hex',
    //         // )
    //         const resetTokenExpiry = Date.now() + 3600000 // 1 hour from now
    //         const res = await ctx.db.user.update({
    //           where: { id: user.id },
    //           data: { resetToken, resetTokenExpiry },
    //           select: { id: true },
    //         })

    //         // 3. Email them that reset token
    //         // sendForgetPassByVendor(ctx, user, resetToken)
    //       }

    //       // 4. Return the message
    //       return 'Thanks!'
    //     },
    //   })
    // t.field('validateCode', {
    //   type: 'AuthPayLoad',
    //   args: {
    //     code: nonNull(stringArg()),
    //     email: stringArg(),
    //     phone: stringArg(),
    //     type: arg({ type: 'userType', default: 'customer' }),
    //   },
    //   //@ts-ignore
    //   async resolve(_root, { code, email, phone, type }, ctx) {
    //     if (email && phone)
    //       throw new Error('you must provide email or phone not both')

    //     if (!email && !phone) throw new Error('you must provide email or phone')
    //     console.log('🚀 ~ file: auth.ts ~ line 666 ~ resolve ~ email', email)

    //     // 1. Check if this is a real user
    //     if (email) {
    //       const user = await ctx.db.user.findFirst({
    //         // select: { id: true, name: true },
    //         where: {
    //           email: { equals: email, mode: 'insensitive' },
    //           resetToken: code,
    //           resetTokenExpiry: { gte: Date.now() - 3600000 },
    //         },
    //       })
    //       if (!user) {
    //         return new Error(`This Code is either invalid or expired!`)
    //       }

    //       const res = await ctx.db.user.update({
    //         where: { id: user.id },
    //         data: { resetToken: null, resetTokenExpiry: null },
    //         select: { id: true,  },
    //       })

    //       const token = ctx.auth.signInWithJWT(user)

    //       return { token, user }
    //     }

    //     // 8. return the new user
    //     return null
    //   },
    // })

    // t.field('resetPassword', {
    //   type: 'User',
    //   args: {
    //     password: nonNull(stringArg()),
    //   },
    //   //@ts-ignore
    //   async resolve(_root, { password }, ctx) {
    //     // 3. Hash their new password
    //     const hashed = await hashPassword(password)
    //     if (!ctx?.user?.id) throw new Error('sorry please try again')
    //     // 4. Save the new password to the user and remove old resetToken fields
    //     const updatedUser = await ctx.db.user.update({
    //       where: { id: ctx?.user?.id },
    //       data: {
    //         password: hashed,
    //       },
    //     })

    //     // 8. return the new user
    //     return updatedUser
    //   },
    // })
  },
})
