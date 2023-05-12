import { varAuth } from './defaults'
import { CURRENT_CUSTOMER } from './queries'

export const authMutation = {
  asyncAuth: async ({ token, user, ...rest }: any) => {
    const client = rest.client

    const auth = varAuth()
    varAuth({
      ...auth,
      user: user || auth.user,
      token,
    })

    const {
      data: { me },
    } = await client.query({
      query: CURRENT_CUSTOMER,
      fetchPolicy: 'network-only',
    })
    console.log('🚀 ~ file: resolvers.ts ~ line 19 ~ asyncAuth: ~ me', client)
    console.log('🚀 ~ file: resolvers.ts:16 ~ asyncAuth: ~ me', me)

    if (me) {
      varAuth({
        ...auth,
        isLogin: me ? true : false,
        token: me ? token : null,
        user: me,
      })
    } else {
      await client.resetStore()
    }

    return 'done'
  },

  signout: async (client) => {
    varAuth({ authLoading: true }, true)

    await client.resetStore()
    varAuth({}, true)
  },
}
