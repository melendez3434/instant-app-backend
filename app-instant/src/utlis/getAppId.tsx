import Constants from 'expo-constants'
import { varPreviewer } from '../modules/previewer/defaults'

export const getAppid = () => {
  let appId =
    Constants.expoConfig?.extra?.appId || Constants.manifest?.extra?.appId || 1
  try {
    if (window?.location?.search?.split('=')[1]) {
      appId = Number(window?.location?.search?.split('=')[1] || 1)
    }
  } catch (error) {
    console.log('🚀 ~ file: getAppId.tsx:21 ~ getAppid ~ error', error)
  }
  console.log('🚀 ~ file: getAppId.tsx:14 ~ getAppid ~ appId', appId)

  return Number(varPreviewer()?.id || appId)
}
export const getEndPoint = () => {
  let url = Constants.manifest?.extra?.isDev
    ? 'https://instantappnow-dev.herokuapp.com/graphql'
    : 'https://instantappnow.herokuapp.com/graphql'
  try {
    if (window) {
      url =
        process.env.NODE_ENV !== 'production'
          ? 'https://instantappnow-dev.herokuapp.com/graphql'
          : 'https://instantappnow.herokuapp.com/graphql'
    }
  } catch (error) {
    console.log('🚀 ~ file: getAppId.tsx:21 ~ getAppid ~ error', error)
  }

  return url
}
