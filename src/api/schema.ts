import * as types from './graphql/types/'
import { DateTimeResolver, JSONObjectResolver } from 'graphql-scalars'
// import { nexusPrisma } from 'nexus-plugin-prisma'
import { GraphQLScalarType } from 'graphql'
import { nexusPrisma } from 'nexus-plugin-prisma'
// import { nexusSchemaPrisma } from 'nexus-plugin-prisma/schema'
import { makeSchema, declarativeWrappingPlugin, asNexusMethod } from 'nexus'
import * as path from 'path'
import { Query } from './graphql/resolvers/query'
import { Mutation } from './graphql/resolvers/mutation/auth'
const jsonScalar = asNexusMethod(JSONObjectResolver, 'json')
const dateTimeScalar = asNexusMethod(DateTimeResolver, 'date')

export const schema = makeSchema({
  types: [dateTimeScalar, jsonScalar, Object.values(types), Query, Mutation],
  plugins: [
    declarativeWrappingPlugin(),
    nexusPrisma({
      experimentalCRUD: true,
      paginationStrategy: 'prisma',
      scalars: {
        DateTime: DateTimeResolver,
        //@ts-ignore
        Json: new GraphQLScalarType({
          ...JSONObjectResolver,
          name: 'Json',
          description:
            'The `JSON` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).',
        }),
      },
    }),
  ],
  outputs: {
    typegen: path.join(
      __dirname,
      '../../node_modules/@types/nexus-typegen/index.d.ts',
    ),
    schema: path.join(__dirname, './api.graphql'),
  },
  // outputs: {
  //   typegen: path.join(
  //     __dirname,
  //     '../../node_modules/@types/nexus-typegen/index.d.ts',
  //   ),
  // },
  // typegenAutoConfig: {
  //   // contextType: '{ prisma: PrismaClient.PrismaClient }',
  //   // sources: [{ source: '.prisma/client', alias: 'PrismaClient' }],
  //   sources: [
  //     {
  //       source: require.resolve('.prisma/client/index.d.ts'),
  //       alias: 'prisma',
  //     },
  //     {
  //       source: require.resolve('./utils/context'),
  //       alias: 'ContextModule',
  //     },
  //   ],
  //   contextType: 'ContextModule.Context',
  // },

  contextType: {
    module: require.resolve('./utils/context'),
    export: 'Context',
  },
  sourceTypes: {
    modules: [
      {
        module: require.resolve('.prisma/client/index.d.ts'),
        alias: 'prisma',
      },
    ],
  },
  // sourceTypes: [
  //   {
  //     source: '.prisma/client',
  //     alias: 'prisma',
  //   },
  //   {
  //     source: require.resolve('./utils/context'),
  //     alias: 'Context',
  //   },
  // ],
  // typegenAutoConfig: {
  //   contextType: 'Context.Context',
  //   sources: [
  //     {
  //       source: '.prisma/client',
  //       alias: 'prisma',
  //     },
  //     {
  //       source: require.resolve('./utils/context'),
  //       alias: 'Context',
  //     },
  //   ],
  // },
  // outputs: {
  //   typegen: path.join(
  //     __dirname,
  //     '../../node_modules/@types/nexus-typegen/index.d.ts',
  //   ),
  //   schema: path.join(__dirname, './api.graphql'),
  // },
  // // shouldGenerateArtifacts: Boolean(
  // //   process.env.NEXUS_SHOULD_EXIT_AFTER_REFLECTION,
  // // ),
  // // outputs: {
  // //   typegen: path.join(
  // //     __dirname,
  // //     '../../node_modules/@types/nexus-typegen/index.d.ts',
  // //   ),
  // // },
  // shouldExitAfterGenerateArtifacts: Boolean(
  //   process.env.NEXUS_SHOULD_EXIT_AFTER_REFLECTION,
  // ),
  // typegenAutoConfig: {
  //   // contextType: '{ prisma: PrismaClient.PrismaClient }',
  //   // sources: [{ source: '.prisma/client', alias: 'PrismaClient' }],
  //   sources: [
  //     {
  //       source: require.resolve('.prisma/client/index.d.ts'),
  //       alias: 'prisma',
  //     },
  //     // {
  //     //   source: require.resolve('./utils/context'),
  //     //   alias: 'ContextModule',
  //     // },
  //   ],
  //   contextType:
  //     '{ auth: Auth, user: any,lang: Langs, db: PrismaClient,  prisma: PrismaClient }',

  //   // contextType: 'ContextModule.Context',
  // },
})
