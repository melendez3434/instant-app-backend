import { makeVar, useReactiveVar } from '@apollo/client'
import { getCache, setCache } from '../../utlis/cacheService'

const initState: any =
  // getCache("auth") ||
  {
    isLogin: false,
    user: null,
    token: '',
    loading: false,
    authLoading: false,
  }

const auth = makeVar({ ...initState, loading: true })
export const varAuth = (newVal?: any, reset?: any) => {
  if (reset) {
    setCache('auth', { ...initState, ...newVal })
    return auth({ ...initState, ...newVal })
  }
  if (typeof newVal !== 'undefined') {
    setCache('auth', newVal)
    return auth(newVal)
  }
  return auth()
}

export const useVarAuth = () => {
  const newData = useReactiveVar(auth)

  return {
    ...newData,
  }
}

export const setAuthDefaults = async () => {
  const authCache = await getCache('auth')
  console.log(
    '🚀 ~ file: defaults.ts ~ line 49 ~ setAuthDefaults ~ authCache',
    authCache,
  )

  auth({ ...(authCache || initState), loading: false })
}
setAuthDefaults()
