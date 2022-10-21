import { queryType } from 'nexus'
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
    })
  },
})
