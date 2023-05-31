import axios from 'axios'
import { nonNull, queryType, stringArg } from 'nexus'
// import moment from 'moment'

export const sort = (nodes, ids) => {
  const array = Array(ids.length)
  nodes.map((product) => {
    array[ids.findIndex((id) => id == product.id)] = product
  })
  return array
}
export const Query = queryType({
  definition(t) {
    t.field('me', {
      type: 'User',
      async resolve(_root, args, ctx) {
        const me = ctx.user

        if (!me) return null
        return ctx.db.user.findUnique({ where: { id: me.id } })
      },
    }),
      t.field('getToken', {
        nullable: true,
        type: 'AuthPayLoad',
        async resolve(_root, args, ctx) {
          const me = ctx.user

          if (!me) return null
          const user = await ctx.db.user.findUnique({ where: { id: me.id } })
          const token = ctx.auth.signInWithJWT(user)
          return {
            user,
            token,
          }
        },
      }),
      t.field('checkWebsite', {
        type: 'Boolean',
        args: {
          url: nonNull(stringArg()),
        },
        async resolve(_root, { url }, ctx) {
          console.log('🚀 ~ file: query.ts:29 ~ resolve ~ url', url)
          try {
            const { data } = await axios(url)
            console.log('🚀 ~ file: query.ts:31 ~ resolve ~ data', data)
          } catch (error) {
            console.log('🚀 ~ file: query.ts:33 ~ resolve ~ error', error)
            return false
          }
          // axios(url)
          //   .then(function (response) {
          //     console.log('🚀 ~ file: query.ts:31 ~ response', response)
          //     return true
          //   })
          //   .catch(function (error) {
          //     console.log('🚀 ~ file: home.tsx:116 ~ fetch ~ error', error)
          //     // setIFrameError(true)
          //     return false
          //   })

          return true
        },
      })
  },
})
