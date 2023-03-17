import * as bcrypt from 'bcryptjs'
import hashPassword from '../../../utils/hashPassword'
import {
  arg,
  enumType,
  inputObjectType,
  intArg,
  mutationType,
  nonNull,
  objectType,
  stringArg,
} from 'nexus'

import isEmail from 'validator/lib/isEmail'
import makeSlug from 'slug-arabic'
import axios from 'axios'
import url from 'url'
import sendSgMail, { MAILER_ITEMS } from '../../../utils/sgMail'

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
    t.field('signupSuperAdmin', {
      type: 'AuthPayLoad',
      args: {
        email: nonNull(stringArg()),
        name: nonNull(stringArg()),
        logo: stringArg(),
        companyName: stringArg(),
        icon: stringArg(),
        password: nonNull(stringArg()),
      },
      async resolve(_root, args, ctx) {
        const { email, password, logo, companyName, icon } = args
        let slugedName = makeSlug(args.name.split(' ').slice(0, 2).join(' '))
        console.log('🚀 ~ file: auth.ts ~ line 35 ~ resolve ~ args', args)
        const isFirstTwoWordNameExist = await ctx.db.builder.findFirst({
          where: {
            name: { equals: slugedName, mode: 'insensitive' },
          },
        })

        if (isFirstTwoWordNameExist) {
          slugedName = makeSlug(args.name.split(' ').slice(0, 3).join(' '))

          const isFirstThreeWordNameExist = await ctx.db.builder.findFirst({
            where: {
              name: { equals: slugedName, mode: 'insensitive' },
            },
          })
          if (isFirstThreeWordNameExist) {
            throw new Error(
              'Sorry but this name already exists' + ' ' + args.name,
            )
          }
        }
        // lowercase their email
        email.toLowerCase()
        if (password.length < 8)
          throw new Error('password must be more than 8 characters')

        const isEmailExist = await ctx.db.user.findFirst({
          where: {
            email: { equals: email, mode: 'insensitive' },
            role: 'superAdmin',
          },
        })

        if (isEmailExist) {
          throw new Error('Email is already exist')
        }
        // hash their password
        const hash = await hashPassword(password)
        // create the user in the database
        const admin = await ctx.db.user.create({
          data: {
            email,
            password: hash,
            role: 'superAdmin',
          },
        })
        await ctx.db.builder.create({
          data: {
            domain: slugedName + '.' + process.env.DOMAIN,
            name: slugedName,
            logo,
            companyName: companyName || slugedName,
            icon: icon || logo,
            owner: {
              connect: {
                id: admin.id,
              },
            },
            users: { connect: { id: admin.id } },
          },
        })
        const token = ctx.auth.signInWithJWT(admin)

        return {
          user: await ctx.db.user.findUnique({
            where: { id: admin.id },
          }),
          token,
        }
      },
    }),
      t.field('signup', {
        type: objectType({
          name: 'AuthPayLoadWithApp',
          definition(t) {
            t.field('user', { type: 'User' })
            t.field('app', { type: 'App' })
            t.string('token')
          },
        }),
        args: {
          email: nonNull(stringArg()),
          registerFrom: stringArg(),
          password: nonNull(stringArg()),
          addAppInput: arg({ type: 'addAppInput' }),
          trialLong: intArg(),
        },
        async resolve(_root, args, ctx) {
          const {
            email,
            password,
            registerFrom,
            addAppInput,
            trialLong,
            ...rest
          } = args

          let appId
          // if (addAppInput) {
          //   const isUrl = url.parse(addAppInput.website)?.hostname
          //   console.log('🚀 ~ file: auth.ts:256 ~ resolve ~ isUrl', isUrl)
          //   if (!isUrl) {
          //     throw new Error('Invalid website url')
          //   }
          // }
          if (addAppInput) {
            if (!addAppInput.website.includes('https://')) {
              addAppInput.website = 'https://' + addAppInput.website
            }

            appId = url
              .parse(addAppInput?.website)
              ?.hostname?.split('.')
              .reverse()
              .join('.')
            if (!appId) throw new Error('Invalid website')
          }

          console.log('🚀 ~ file: auth.ts ~ line 35 ~ resolve ~ args', args)
          // lowercase their email
          email.toLowerCase()

          if (password.length < 8)
            throw new Error('password must be more than 8 characters')

          const isEmailExist = await ctx.db.user.findFirst({
            where: {
              email: { equals: email, mode: 'insensitive' },
              builderDomain: { equals: ctx.builderDomain },
            },
          })

          if (isEmailExist) {
            throw new Error('Email does not exist')
          }
          // hash their password
          const hash = await hashPassword(password)
          // create the user in the database
          const admin = await ctx.db.user.create({
            data: {
              ...rest,
              email,
              password: hash,
              builder: { connect: { domain: ctx.builderDomain } },
              role: 'user',
              registerFrom,
            },
          })
          const token = ctx.auth.signInWithJWT(admin)

          const apps = await ctx.db.app.findMany({
            where: { tempOwner: email },
            select: { id: true },
          })
          Promise.all(
            apps.map(async ({ id }) => {
              await ctx.db.app.update({
                where: { id },
                data: {
                  tempOwner: null,
                  owner: { connect: { id: admin.id } },
                },
              })
            }),
          )
          try {
            const builder = await ctx.db.builder.findUnique({
              where: { domain: ctx.builderDomain },
              select: {
                mailListId: true,
                mailApiToken: true,
              },
            })
            console.log(
              '🚀 ~ file: auth.ts ~ line 158 ~ resolve ~ builder',
              builder,
            )

            if (builder?.mailApiToken && builder.mailListId) {
              const { data } = await axios(
                'https://mail.husl.app/api/v1/subscribers?list_uid=' +
                  builder.mailListId,
                {
                  method: 'post',

                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    // Cookie:
                    //   "XSRF-TOKEN=eyJpdiI6Im9sS3R5TGJHaXB4eVIzR3RzamVEOEE9PSIsInZhbHVlIjoiNnJEbmlGRUZJRTlmZUlGKzJMOUpSNjIwL3plRXFMR01sTG1JNmRWQTRxb1lDNUQyZ25xRnZ3MFI0RHdPZFg5UDJ6cm1PbTM1cThtTHZiUTh0NUptcXY5a0Z0UkI1aktsWmhtYzM0V0RSOGtEdy9oREpmSVY2ZVRudXowK3hLdWsiLCJtYWMiOiIxZTQ5ZTcyNGE0MzQwYjMzMWY3ZGJlYTg3Njk4N2Y5NTgwYzE3Zjk5Mjg0MmZiMDBmZDc1YWFiMDdjMjI4YzQ1IiwidGFnIjoiIn0%3D; acelle_mail_session=eyJpdiI6IllmT09HemtRVG5lemwwOHduR1ZYRXc9PSIsInZhbHVlIjoiNDVRdUJPL0FmNDk5bytLUTY5TnVGemFndHRHWXdoNzAvUWVoUTBLTHIzZUVFS1NET212QWJOM043aC9VbXEzZUF1WjZpY0RFS2dXclVaQzU2dVQ5MTV5TThXZTB2Qk1Nc0xPSnN1cHhNY2FlSTlVTmJDTC9Jc0t0ZGsyQkQ2aXYiLCJtYWMiOiI3NDQ4MjlkZjJlYWM0OTRjYTRiMGU0N2NhZmE3MGU4OGQzNzZlYzAwNDIyYWJhN2EyYjYyYzQzNmY4MDgwNGM0IiwidGFnIjoiIn0%3D",
                  },
                  data: JSON.stringify({
                    api_token: builder?.mailApiToken,
                    EMAIL: email,
                    builderDomain: ctx.builderDomain,
                  }),
                },
              )
              console.log(
                '🚀 ~ file: auth.ts ~ line 166 ~ resolve ~ data',
                data.res.data,
              )
            }
          } catch (error) {
            console.log(
              '🚀 ~ file: auth.ts ~ line 163 ~ resolve ~ error',
              //@ts-ignore
              error?.response?.data,
            )
          }
          const trialNumber = !trialLong ? 0 : trialLong > 60 ? 60 : trialLong
          let app

          if (addAppInput) {
            app = await ctx.db.app.create({
              data: {
                name: addAppInput?.name,
                website: addAppInput?.website,
                lang: 'EN',
                appId,
                assets: { create: { displayLogo: true, color: '#000' } },
                design: { create: { AppDesignDrawer: { create: {} } } },
                trialLong: trialNumber,
                owner: { connect: { id: admin.id } },
              },
            })
          }

          return { user: admin, token, app }
        },
      }),
      t.field('fastSignup', {
        type: 'Boolean',
        args: {
          email: nonNull(stringArg()),
          website: nonNull(stringArg()),
        },
        async resolve(_root, args, ctx) {
          let { email, website } = args

          if (!website.includes('https://')) {
            website = 'https://' + website
          }

          const appId = url
            .parse(website)
            ?.hostname?.split('.')
            .reverse()
            .join('.')
          const name = url.parse(website)?.hostname?.split('.')[0]
          if (!appId || !name) throw new Error('Invalid website')

          email.toLowerCase()

          const isEmailExist = await ctx.db.user.findFirst({
            where: {
              email: { equals: email, mode: 'insensitive' },
              builderDomain: { equals: ctx.builderDomain },
            },
          })

          if (isEmailExist) {
            throw new Error('Email does not exist')
          }
          const isAppExist = await ctx.db.app.count({
            where: {
              website,
              tempOwner: email,
            },
          })
          !isAppExist &&
            (await ctx.db.app.create({
              data: {
                name,
                website,
                lang: 'EN',
                appId,
                assets: { create: { displayLogo: true, color: '#000' } },
                design: { create: { AppDesignDrawer: { create: {} } } },
                tempOwner: email,
              },
            }))
          return true
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
              builderDomain: ctx.builderDomain,
              role: { not: 'appUser' },
            },
          })

          if (!isEmailExist) {
            throw new Error('Email does not exist')
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

    t.field('signupInApp', {
      type: 'AuthPayLoad',
      args: {
        data: nonNull(
          arg({
            type: inputObjectType({
              name: 'SignUpInput',
              definition(t) {
                t.nonNull.string('name')
                t.nonNull.string('email')
                t.nonNull.string('password')
              },
            }),
          }),
        ),
      },
      async resolve(_root, args, ctx) {
        const {
          email,
          password,

          ...rest
        } = args.data
        console.log('🚀 ~ file: auth.ts ~ line 35 ~ resolve ~ args', args)
        // lowercase their email
        email.toLowerCase()

        if (password.length < 8)
          throw new Error('password must be more than 8 characters')

        const isEmailExist = await ctx.db.user.findFirst({
          where: {
            email: { equals: email, mode: 'insensitive' },
            appId: { equals: ctx.appId },
          },
        })

        if (isEmailExist) {
          throw new Error('Email does not exist')
        }
        // hash their password
        const hash = await hashPassword(password)
        // create the user in the database
        const app = await ctx.db.app.findUnique({
          where: { id: ctx.appId },
          select: { owner: { select: { builderDomain: true } } },
        })

        const user = await ctx.db.user.create({
          data: {
            ...rest,
            email,
            password: hash,
            role: 'appUser',
            inApp: { connect: { id: ctx.appId } },
            builder: app?.owner?.builderDomain
              ? { connect: { domain: app?.owner?.builderDomain } }
              : undefined,
          },
        })
        const token = ctx.auth.signInWithJWT(user)

        return { user, token }
      },
    }),
      t.field('signinInApp', {
        type: 'AuthPayLoad',
        args: {
          data: nonNull(
            arg({
              type: inputObjectType({
                name: 'LoginInput',
                definition(t) {
                  t.nonNull.string('email')
                  t.nonNull.string('password')
                },
              }),
            }),
          ),
        },
        async resolve(_root, args, ctx) {
          const {
            email,
            password,
            //  type
          } = args.data

          const isEmailExist = await ctx.db.user.findFirst({
            where: {
              email: email ? { equals: email, mode: 'insensitive' } : undefined,
              appId: ctx.appId,
              role: 'appUser',
            },
          })

          if (!isEmailExist) {
            throw new Error('Email does not exist')
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
      })
    t.field('requestReset', {
      type: 'String',
      args: {
        email: nonNull(stringArg()),
      },
      //@ts-ignore
      async resolve(_root, { email }, ctx) {
        const user = await ctx.db.user.findFirst({
          select: { id: true },
          where: {
            email: { equals: email, mode: 'insensitive' },
            builderDomain: { equals: ctx.builderDomain },
          },
        })

        if (!user) {
          return new Error(`No such user found for email ${email}`)
        }
        // 2. Set a reset token and expiry on that user
        const resetToken = randomString(4, '#')

        const resetTokenExpiry = Date.now() + 3600000 // 1 hour from now

        await sendSgMail({
          dynamic_template_data: { code: resetToken },
          to: email,
          templateId: MAILER_ITEMS.RESET_CODE,
          subject: 'Reset Password',
        })

        const res = await ctx.db.user.update({
          where: { id: user.id },
          data: { resetToken, resetTokenExpiry },
          select: { id: true },
        })

        // 4. Return the message
        return 'Thanks!'
      },
    })
    t.field('validateCode', {
      type: 'AuthPayLoad',
      args: {
        code: nonNull(stringArg()),
        email: nonNull(stringArg()),
      },
      //@ts-ignore
      async resolve(_root, { code, email, phone, type }, ctx) {
        const user = await ctx.db.user.findFirst({
          // select: { id: true, name: true },
          where: {
            email: { equals: email, mode: 'insensitive' },
            resetToken: code,
            resetTokenExpiry: { gte: Date.now() - 3600000 },
          },
        })
        if (!user) {
          return new Error(`This Code is either invalid or expired!`)
        }

        const res = await ctx.db.user.update({
          where: { id: user.id },
          data: { resetToken: null, resetTokenExpiry: null },
          select: { id: true },
        })

        const token = ctx.auth.signInWithJWT(user)

        return { token, user }
      },
    })

    t.field('resetPassword', {
      type: 'User',
      args: {
        password: nonNull(stringArg()),
      },
      //@ts-ignore
      async resolve(_root, { password }, ctx) {
        // 3. Hash their new password
        const hashed = await hashPassword(password)
        if (!ctx?.user?.id) throw new Error('sorry please try again')
        // 4. Save the new password to the user and remove old resetToken fields
        const updatedUser = await ctx.db.user.update({
          where: { id: ctx?.user?.id },
          data: {
            password: hashed,
          },
        })

        // 8. return the new user
        return updatedUser
      },
    })
  },
})

// sendSgMail({
//   dynamic_template_data: { code: '0000' },
//   to: 'ahmedmagdyb7r@gmail.com',
//   templateId: MAILER_ITEMS.RESET_CODE,
//   subject: 'Reset Password',
// })
//   .then((res) => {
//     console.log('🚀 ~ file: auth.ts ~ line 35 ~ resolve ~ res', res)
//   })
//   .catch((err) => {
//     console.log(
//       '🚀 ~ file: auth.ts ~ line 35 ~ resolve ~ err',
//       err.response.body.errors,
//     )
//   })
