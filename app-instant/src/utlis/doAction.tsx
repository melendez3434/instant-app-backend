import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { Share } from 'react-native'
export const doAction = async (
  type: LinkType,
  data: any,
  navigation,
  varWebsiteUrl,
) => {
  console.log('🚀 ~ file: home.tsx ~ line 37 ~ doAction ~ data', data)
  // window.document.getElementById('shareId')?.click()
  switch (type) {
    case 'link':
      varWebsiteUrl(data.value)

      break
    case 'callPhone':
      const args = {
        number: data.value,
        prompt: true,
      }
      // Make a call
      // call(args).catch(console.error);
      // Linking.openUrl('tel:+12 XXX XXX XXX')
      Linking.openURL('tel:' + data.value)

      break
    case 'externalLink':
      // toast.error('will open mobile browser in the native version ')
      // setExternalLink(data.value)
      let result = await WebBrowser.openBrowserAsync(data.value)
      console.log('🚀 ~ file: home.tsx ~ line 49 ~ doAction ~ result', result)
      break
    case 'openModal':
      //@ts-ignore
      navigation.toggleDrawer()
      break
    case 'sendEmail':
      // window.open('mailto:' + data.value)
      Linking.openURL('mailto:' + data.value)
      break
    case 'share':
      Share.share({
        message: data.value,
      })
        //after successful share return result
        .then((result) => console.log(result))
        //If any thing goes wrong it comes here
        .catch((errorMsg) => console.log(errorMsg))
      // toast.error('will open share modal in the native version ')
      break
    case 'screen':
      //@ts-ignore
      navigation.navigate('MyAccountStack', { screen: data.value })
      break
    default:
      break
  }
}

export type LinkType =
  | 'link'
  | 'externalLink'
  | 'share'
  | 'sendEmail'
  | 'callPhone'
  | 'openModal'
  | 'screen'
