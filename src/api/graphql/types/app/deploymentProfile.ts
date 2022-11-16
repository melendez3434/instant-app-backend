import {
  arg,
  extendType,
  inputObjectType,
  intArg,
  nonNull,
  objectType,
} from 'nexus'

export const IosProfile = objectType({
  name: 'IosProfile',
  definition(t) {
    t.model.id()
    t.model.isEnrolledToApple()
    t.model.addAdminToApple()
    t.model.keywords()
    t.model.logo()
    t.model.appStoreTitle()
    t.model.storeDescription()
    t.model.organizationName()
    t.model.developerName()
    t.model.primaryEmail()
    t.model.fullName()
    t.model.phoneNumber()
    t.model.accountHolder()
  },
})

export const AndroidProfile = objectType({
  name: 'AndroidProfile',
  definition(t) {
    t.model.id()
    t.model.isEnrolledToGoogle()
    t.model.willPublsihYourApp()
    t.model.setupNewAccount()
    t.model.googleDeveloperAccount()
    t.model.appStoreTitle()
    t.model.logo()
    t.model.storeDescription()
    t.model.keywords()
  },
})

export const DeployRequest = objectType({
  name: 'DeployRequest',
  definition(t) {
    t.model.id()
    t.model.createdAt()
    t.model.platform()
    t.model.reason()
    t.model.status()
  },
})
export const DeploymentQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.iosProfile()
    t.crud.androidProfile()

    t.field('iosProfile', {
      type: 'IosProfile',
      args: {
        id: nonNull(intArg()),
      },
      async resolve(source, args, ctx) {
        const { id } = args
        return await ctx.db.iosProfile.findUnique({ where: { appId: id } })
      },
    })
    t.field('androidProfile', {
      type: 'AndroidProfile',
      args: {
        id: nonNull(intArg()),
      },
      async resolve(source, args, ctx) {
        const { id } = args
        return await ctx.db.androidProfile.findUnique({ where: { appId: id } })
      },
    })
  },
})
export const Deploymentmutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateIosProfile', {
      type: 'IosProfile',
      args: {
        id: nonNull(intArg()),
        data: arg({
          type: inputObjectType({
            name: 'updateIosProfileInput',
            definition(t) {
              t.nonNull.string('logo')
              t.nonNull.string('primaryEmail')
              t.nonNull.string('storeDescription')
              t.nonNull.string('phoneNumber')
              t.nonNull.string('developerName')
              t.nonNull.string('fullName')
              t.nonNull.string('accountHolder')
              t.nonNull.string('keywords')
              t.nonNull.string('appStoreTitle')
              t.nonNull.string('organizationName')
              t.nonNull.boolean('isEnrolledToApple')
              t.nonNull.boolean('addAdminToApple')
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        return await ctx.db.iosProfile.upsert({
          where: { appId: args.id },
          update: args.data,
          create: { ...args.data, App: { connect: { id: args.id } } },
        })
      },
    })
    t.field('updateAndroidProfile', {
      type: 'AndroidProfile',
      args: {
        id: nonNull(intArg()),
        data: arg({
          type: inputObjectType({
            name: 'updateAndroidProfileInput',
            definition(t) {
              t.nonNull.string('logo')
              t.nonNull.string('googleDeveloperAccount')
              t.nonNull.string('storeDescription')
              t.nonNull.string('appStoreTitle')
              t.nonNull.string('keywords')
              t.nonNull.boolean('isEnrolledToGoogle')
              t.nonNull.boolean('willPublsihYourApp')
              t.nonNull.boolean('setupNewAccount')
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        return await ctx.db.androidProfile.upsert({
          where: { appId: args.id },
          update: args.data,
          create: { ...args.data, App: { connect: { id: args.id } } },
        })
      },
    })
    t.field('addDeployRequest', {
      type: 'DeployRequest',
      args: {
        id: nonNull(intArg()),
        data: arg({
          type: inputObjectType({
            name: 'updateDeployRequestInput',
            definition(t) {
              t.nonNull.field('platform', { type: 'AppBuildPlatform' })
            },
          }),
          required: true,
        }),
      },

      async resolve(_root, args, ctx) {
        if (args.data.platform == 'android') {
          const isThereProfile = await ctx.db.androidProfile.count({
            where: {
              appId: args.id,
            },
          })
          if (isThereProfile) throw new Error('Must finish the profile first')
        } else {
          const isThereProfile = await ctx.db.iosProfile.count({
            where: {
              appId: args.id,
            },
          })
          if (isThereProfile) throw new Error('Must finish the profile first')
        }
        const isThereWaitingRequest = await ctx.db.deployRequest.count({
          where: {
            appId: args.id,
            status: 'waiting',
            platform: args.data.platform,
          },
        })
        if (isThereWaitingRequest)
          throw new Error(
            'There is a waiting request please wait until it finished',
          )

        return await ctx.db.deployRequest.create({
          data: {
            platform: args.data.platform,

            App: { connect: { id: args.id } },
          },
        })
      },
    })
  },
})
