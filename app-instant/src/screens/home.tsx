import { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
  ImageBackground,
  Share,
  Platform,
} from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import { gql, useLazyQuery, useQuery } from '@apollo/client'
import { WebView } from 'react-native-webview'
import { useNavigation } from '@react-navigation/native'
import { APP_INFO, NAVIGATION_LINKS } from '../graphql/query'
import {
  Tab,
  Text,
  Icon,
  Header,
  LinearProgress,
  ListItem,
  Image,
} from '@rneui/themed'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import React from 'react'
// import call from 'react-native-phone-call';
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { StatusBar } from 'expo-status-bar'
import { useWebsiteUrl } from '../modules'
import { doAction } from '../utlis/doAction'
import HeaderComp from '../components/layout/header'
import Bottomtabs from '../components/layout/footer'
import Container from '../components/common/container'
import { getAppid } from '../utlis/getAppId'

// const varWebsiteUrl = makeVar('')

const CHECK_WEBSITE = gql`
  query CHECK_WEBSITE($url: String!) {
    checkWebsite(url: $url)
  }
`

export default function HomeScreen() {
  const navigation = useNavigation()

  const { data } = useQuery(APP_INFO, {
    variables: { id: getAppid() },
  })
  const [checkWebsite] = useLazyQuery(CHECK_WEBSITE, {
    onCompleted: (data) => {
      if (data?.checkWebsite == false) {
        setIFrameError(true)
      }
    },
  })

  // const [externalLink, setExternalLink] = useState(null)
  // const [websiteUrl, setWebsiteUrl] = useState(data.app?.website)
  //@ts-ignore
  const { varWebsiteUrl, websiteUrl = data.app?.website } = useWebsiteUrl()
  // const websiteUrl = useReactiveVar(varWebsiteUrl) || data.app?.website

  // const websiteUrl = useReactiveVar(varWebsiteUrl) || data.app?.website

  const [loading, setLoading] = useState(true)
  const [iFrameError, setIFrameError] = useState(false)
  const [pageTitle, setPageTitle] = useState('')

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 6000)
  }, [websiteUrl])
  useEffect(() => {
    varWebsiteUrl(data.app?.website)
  }, [])

  // const doAction = async (type: LinkType, data: any) => {
  //   console.log('🚀 ~ file: home.tsx ~ line 37 ~ doAction ~ data', data)
  //   // window.document.getElementById('shareId')?.click()
  //   switch (type) {
  //     case 'link':
  //       setWebsiteUrl(data.value)

  //       break
  //     case 'callPhone':
  //       window.open('tel:' + data.value)
  //       break
  //     case 'externalLink':
  //       // toast.error('will open mobile browser in the native version ')
  //       // setExternalLink(data.value)
  //       let result = await WebBrowser.openBrowserAsync(data.value)
  //       console.log('🚀 ~ file: home.tsx ~ line 49 ~ doAction ~ result', result)
  //       break
  //     case 'openModal':
  //       break
  //     case 'sendEmail':
  //       window.open('mailto:' + data.value)

  //       break
  //     case 'share':
  //       // toast.error('will open share modal in the native version ')
  //       break
  //     default:
  //       break
  //   }
  // }
  const {
    themeColor,
    titleTheme,
    progressIndicator,
    disblayPagetitle,
    progressIndicatorColor,
    pullToRefresh,
    activeTabColor,
    navigationActiveColor,
    layoutTemplate,
  } = data?.app?.design || {}

  const { website } = data?.app || {}

  useEffect(() => {
    if (Platform.OS == 'web') {
      checkWebsite({
        variables: {
          url: websiteUrl,
        },
      })

      // fetch(websiteUrl)
      //   .then(function (response) {
      //     console.log(response.status) // returns 200
      //   })
      //   .catch(function (error) {
      //     console.log('🚀 ~ file: home.tsx:116 ~ fetch ~ error', error)
      //     setIFrameError(true)
      //   })
    }
  }, [websiteUrl])

  return (
    <Container style={styles.container}>
      <HeaderComp
        pageTitle={pageTitle}
        // setWebsiteUrl={setWebsiteUrl}
        websiteUrl={websiteUrl}
        loading={loading}
      />

      {Platform.OS == 'web' ? (
        <>
          {iFrameError ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'red' }}>
                Error Loading Page
              </Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'red' }}>
                Please Check Your Internet Connection or the website is not
                available
              </Text>
            </View>
          ) : (
            <iframe
              src={websiteUrl}
              style={{ width: '100%', height: '100%' }}
              frameBorder="0"
              // onError={(e) => {
              //   console.log('🚀 ~ file: home.tsx ~ line 125 ~ onError ~ e', e)
              //   return 'test'
              // }}
              // onLoad={(e) => {
              //   console.log('🚀 ~ file: home.tsx ~ line 125 ~ onError ~ e', e)
              //   return 'test'
              // }}
            ></iframe>
          )}
        </>
      ) : (
        <WebView
          pullToRefreshEnabled={pullToRefresh}
          style={styles.webContainer}
          source={{ uri: websiteUrl }}
          onLoad={(event) => {
            setPageTitle(event.nativeEvent.title)
            setLoading(false)
          }}
        />
      )}
      <Bottomtabs loading={loading} />
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {},
  webContainer: {},
})
