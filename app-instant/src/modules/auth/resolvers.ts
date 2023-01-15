import { varAuth } from './defaults'
import { CURRENT_CUSTOMER } from './queries'

export const authMutation = {
  asyncAuth: async ({ token, ...rest }: any) => {
    const client = rest.client

    const auth = varAuth()
    varAuth({
      ...auth,
      token,
    })

    const {
      data: { me },
    } = await client.query({
      query: CURRENT_CUSTOMER,
      fetchPolicy: 'network-only',
    })
    console.log('🚀 ~ file: resolvers.ts ~ line 19 ~ asyncAuth: ~ me', client)

    if (me) {
      varAuth({
        ...auth,
        isLogin: me ? true : false,
        token: me ? token : null,
        user: me,
      })
    } else {
    }
    await client.resetStore()

    return 'done'
  },

  signout: async (client) => {
    varAuth({ authLoading: true }, true)

    await client.resetStore()
    varAuth({}, true)
  },
}
