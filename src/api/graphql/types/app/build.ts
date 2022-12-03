import {
  arg,
  extendType,
  inputObjectType,
  intArg,
  nonNull,
  objectType,
  enumType,
  stringArg,
  booleanArg,
} from 'nexus'
var url = require('url')
var cmd = require('node-cmd')

const http = require('http') // or 'https' for https:// URLs
// const fs = require('fs').promises
const path = require('path')
import fs from 'fs'

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
    t.model.buildType()

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
        buildType: nonNull(arg({ type: 'BuildType', default: 'apk' })),
        keystoreUrl: stringArg(),
        keystorePassword: stringArg(),
        keyAlias: stringArg(),
        keyPassword: stringArg(),
        androidCertAuto: booleanArg(),
        provisioningProfilePath: stringArg(),
        distributionCertificate: stringArg(),
        distributionCertificatePassword: stringArg(),
        // buildType: arg({
        //   type: enumType({
        //     members: ['apk', 'AAP'],
        //     name: 'AndroidBuildType',
        //   }),
        //   default: 'apk',
        // }),
      },

      async resolve(_root, { id, platform, buildType, ...rest }, ctx) {
        console.log('🚀 ~ file: build.ts:102 ~ resolve ~ buildType', buildType)
        console.log('🚀 ~ file: build.ts:102 ~ resolve ~ platform', platform)
        const app = await ctx.db.app.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            appId: true,
            assets: {
              select: {
                appIcon: true,
                splashMode: true,
                backgroundImage: true,
                displayLogo: true,
                color: true,
              },
            },
            appBuilds: {
              where: { platform, status: 'success' },
              orderBy: { id: 'desc' },
              select: {
                appVersion: true,
              },
              take: 1,
            },
          },
        })
        const AppBuild = await ctx.db.appBuild.create({
          data: {
            App: { connect: { id } },
            platform,
            buildType: platform == 'android' ? buildType : undefined,
          },
        })

        cmd.run(
          `
            npx  expo logout
            npx  expo login -u instantappbuilder -p instantappbuilder
            `,
          async function (err, authData, stderr) {
            console.log('🚀 ~ file: app.ts ~ line 378 ~ authData', authData)
            const appVersion = app?.appBuilds[0]
              ? app?.appBuilds[0]?.appVersion
                  ?.split('.')
                  .map((v, i) => (i ? v : Number(v) + 1))
                  .join('.')
              : '1.0.0'
            console.log(
              '🚀 ~ file: build.ts ~ line 105 ~ appVersion',
              appVersion,
            )
            console.log(
              '🚀 ~ file: build.ts:156 ~ process.env.NODE_ENV',
              process.env.NODE_ENV,
            )

            if (process.env.NODE_ENV !== 'development') {
              const fileName = path.resolve(
                __dirname,
                '../../../../../app-instant/eas.json',
              )
              const file = require(fileName)
              console.log('🚀 ~ file: build.ts ~ line 118 ~ file', file)

              file.build.preview.android.buildType = buildType

              await fs.promises.writeFile(
                fileName,
                JSON.stringify(file, null, 2),
                // function writeJSON(err) {
                //   if (err) return console.log(err)
                //   console.log(JSON.stringify(file))
                //   console.log('writing to ' + fileName)
                // },
              )
            }
            try {
              await changeCerts({ ...rest })

              cmd.run(
                `
                cd ./app-instant
                APP_NAME=${app?.name} APP_VERSION=${appVersion} BUNDLE_ID=${
                  app?.appId
                }  ${
                  app?.assets?.appIcon ? `APP_ICON=${app?.assets?.appIcon}` : ''
                } APP_ID=${app?.id} SPLASH_IMAGE=${
                  app?.assets?.splashMode == 'image'
                    ? app?.assets?.backgroundImage
                    : app?.assets?.displayLogo
                } SPLASH_BACKGROUND_COLOR=${
                  app?.assets?.color
                }  npx eas build --platform ${platform}  --json  --non-interactive

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
                    const [buildData] = getJsonFromString(data)
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
            } catch (error) {
              console.log('🚀 ~ file: build.ts:184 ~ error', error)
            }
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

const downloadFileAndMoveItToAppCerts = (filename, url) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename)
    const request = http.get(url, function (response) {
      response.pipe(file)

      // after download completed close filestream
      file.on('finish', () => {
        file.close()
        console.log('Download Completed')
        fs.rename(filename, 'app-instant/certs/' + filename, () => {
          resolve('done')
        })
      })
    })
  })
}

const changeCerts = async ({
  keystoreUrl,
  keystorePassword,
  keyAlias,
  keyPassword,
  androidCertAuto,
  provisioningProfilePath,
  distributionCertificate,
  distributionCertificatePassword,
}: any) => {
  if (process.env.NODE_ENV !== 'development') {
    const fileName = path.resolve(
      __dirname,
      '../../../../../app-instant/credentials.json',
    )
    const file = require(fileName)

    if (androidCertAuto) {
      file.android = {
        credentialsSource: 'remote',
      }
    } else {
      try {
        keystoreUrl &&
          (await downloadFileAndMoveItToAppCerts(
            'release.keystore',
            keystoreUrl,
          ))
      } catch (error) {
        console.log('🚀 ~ file: build.ts:325 ~ error', error)
      }

      file.android = {
        keystore: {
          keystorePath: 'certs/release.keystore',
          keystorePassword: keystorePassword,
          keyAlias: keyAlias,
          keyPassword: keyPassword,
        },
      }
    }
    try {
      provisioningProfilePath &&
        (await downloadFileAndMoveItToAppCerts(
          'profile.mobileprovision',
          provisioningProfilePath,
        ))
      distributionCertificate &&
        (await downloadFileAndMoveItToAppCerts(
          'dist-cert.p12',
          distributionCertificate,
        ))
    } catch (error) {
      console.log('🚀 ~ file: build.ts:350 ~ error', error)
    }

    file.ios = {
      provisioningProfilePath: 'certs/profile.mobileprovision',
      distributionCertificate: {
        path: 'certs/dist-cert.p12',
        password: distributionCertificatePassword,
      },
    }

    await fs.promises.writeFile(
      fileName,
      JSON.stringify(file, null, 2),
      // function writeJSON(err) {
      //   if (err) return console.log(err)
      //   console.log(JSON.stringify(file))
      //   console.log('writing to ' + fileName)
      // },
    )
  }
}

const getJsonFromString = (string) => {
  return JSON.parse(('[' + string.split('[').pop()).toString())
}
