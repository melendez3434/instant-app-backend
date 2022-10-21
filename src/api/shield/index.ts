import { shield, chain } from 'graphql-shield'
import { mutationsShield, queriesShield } from './resolvers'

// import { logAva1, logAva2, logReq1 } from './logger';
import { isSuperAdmin, isHaveRole } from './rules'
const queries = Object.values(queriesShield).reduce(
  (prev, { slug, permissions, role }: any) => {
    let more: any = []

    prev[slug] = chain(permissions, isHaveRole(role, slug), ...more)
    return prev
  },
  {},
)
// const mutations = Object.values(mutationsShield).reduce(
//   (prev, { slug, permissions, role }: any) => {
//     let more: any = []

//     prev[slug] = chain(permissions, isHaveRole(role, slug), ...more)
//     return prev
//   },
//   {},
// )

export const permissions = shield(
  {
    Mutation: {
      //@ts-ignore

      '*': isSuperAdmin,
      // ...mutations,
      //   updateAddress: race(chain(isAuth, isMyAddress), isSuperAdmin),
      // requestReset: allow,
      // resetPassword: allow,
    },
    Query: {
      // getInventoryOfOrder: allow,
      '*': isSuperAdmin,

      ...queries,
    },
  },
  { debug: true, allowExternalErrors: true },
)
