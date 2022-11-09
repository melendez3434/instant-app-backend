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

export const AppBuildQuery = extendType({
  type: 'Query',
  definition(t) {
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
        appId: nonNull(intArg()),
      },
      async resolve(source, { appId, ...args }, ctx) {
        //@ts-ignore
        args.where = {
          //@ts-ignore
          ...args.where,
          appId: { equals: appId },
        } //@ts-ignore
        const count = await ctx.db.appBuild.count({ where: args.where })

        return {
          //@ts-ignore
          count,
          //@ts-ignore

          nodes: await ctx.db.appBuild.findMany(args),
        }
      },
    })
  },
})
export const AppBuildMutations = extendType({
  type: 'Mutation',
  definition(t) {
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
                console.log('🚀 ~ file: app.ts ~ line 385 ~ stderr', stderr)
                console.log('🚀 ~ file: app.ts ~ line 385 ~ err', err)
                console.log('🚀 ~ file: app.ts ~ line 385 ~ data', data)
                if (err) {
                  return await ctx.db.appBuild.update({
                    where: { id: AppBuild.id },
                    data: {
                      data: JSON.stringify({ err, data, stderr }),
                      status: 'failed',
                    },
                  })
                }

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
