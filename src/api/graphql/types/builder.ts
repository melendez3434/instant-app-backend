import { arg, extendType, inputObjectType, intArg, objectType } from 'nexus'

export const Builder = objectType({
  name: 'Builder',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.logo()
    t.model.domain()
    t.model.createdAt()
    t.model.updatedAt()
  },
})

export const BuilderQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.users({ filtering: true, ordering: true, pagination: true })
    t.field('myBuilder', {
      type: 'Builder',
      async resolve(source, args, ctx) {
        // console.log(
        //   '🚀 ~ file: builder.ts ~ line 25 ~ resolve ~ source',
        //   await ctx.db.builder.deleteMany({}),
        //   await ctx.db.user.deleteMany({}),
        // )

        return await ctx.db.builder.findUnique({
          where: { domain: ctx.builderDomain },
        })
      },
    })
  },
})

export const Buildermutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateMyBuilder', {
      type: 'Builder',
      args: {
        data: arg({
          type: inputObjectType({
            name: 'updateMyBuilderInput',
            definition(t) {
              t.nonNull.string('logo')
            },
          }),
          required: true,
        }),
      },
      async resolve(source, args, ctx) {
        return await ctx.db.builder.update({
          where: { domain: ctx.builderDomain },
          data: { logo: args.data.logo },
        })
      },
    })
  },
})
