import { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
  ImageBackground,
  Share,
} from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import Constants from 'expo-constants'
import { useQuery, gql, makeVar, useReactiveVar } from '@apollo/client'
import { WebView } from 'react-native-webview'
import { useNavigation } from '@react-navigation/native'
import { APP_INFO, NAVIGATION_LINKS } from '../graphql/query'
import * as WebBrowser from 'expo-web-browser'
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
import * as Linking from 'expo-linking'
const varWebsiteUrl = makeVar('')

const doAction = async (type: LinkType, data: any, navigation) => {
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
export default function HomeScreen() {
  const navigation = useNavigation()

  const { data } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest.extra.appId) },
  })
  // const [externalLink, setExternalLink] = useState(null)
  // const [websiteUrl, setWebsiteUrl] = useState(data.app?.website)
  const websiteUrl = useReactiveVar(varWebsiteUrl) || data.app?.website
  console.log(
    '🚀 ~ file: home.tsx ~ line 75 ~ HomeScreen ~ websiteUrl',
    websiteUrl,
  )
  const [loading, setLoading] = useState(true)
  const { height, width } = useWindowDimensions()

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

  return (
    <View style={styles.container}>
      <HeaderComp
        pageTitle={pageTitle}
        // setWebsiteUrl={setWebsiteUrl}
        websiteUrl={websiteUrl}
      />
      {progressIndicator == 'linear' && loading && (
        <LinearProgress color={progressIndicatorColor} />
      )}

      <WebView
        pullToRefreshEnabled={pullToRefresh}
        style={styles.webContainer}
        source={{ uri: websiteUrl }}
        onLoad={(event) => {
          setPageTitle(event.nativeEvent.title)
          setLoading(false)
        }}
      />
      {progressIndicator == 'circular' && loading && (
        <ActivityIndicator
          color={progressIndicatorColor}
          style={{ position: 'absolute', top: height / 2, left: width / 2 }}
          size="large"
        />
      )}
      <Bottomtabs />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webContainer: {},
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 5,
  },
})

const Bottomtabs = ({}) => {
  const [value, setValue] = React.useState(0)
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { data, loading, error, refetch } = useQuery(NAVIGATION_LINKS, {
    variables: {
      appId: Number(Constants.manifest.extra.appId),
      where: { menuType: { equals: 'main' } },
    },
  })
  console.log('🚀 ~ file: home.tsx ~ line 123 ~ Bottomtabs ~ error', error)
  console.log('🚀 ~ file: home.tsx ~ line 123 ~ Bottomtabs ~ data', data)
  const { data: dataApp } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest.extra.appId) },
  })
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
  } = dataApp?.app?.design || {}
  // if (loading || !data?.links?.nodes?.length) return <></>;
  if (layoutTemplate !== 'tabBar') return <></>

  return (
    <>
      <Tab
        value={value}
        onChange={(e) => {
          setValue(e)
          const item = data?.links?.nodes[e]
          doAction(item.type, item.data, navigation)
        }}
        indicatorStyle={{
          backgroundColor: activeTabColor,
          height: 3,
        }}
        style={{ marginBottom: Math.max(insets.bottom, 16) }}
        // variant="primary"
      >
        {data?.links?.nodes.map(
          ({ id, name, type, data, icon }: any, i: number) => (
            <Tab.Item
              key={id}
              onPress={() => doAction(type, data, navigation)}
              title={name}
              titleStyle={{
                fontSize: 12,
                color: i == value ? activeTabColor : '#000',
              }}
              icon={{
                name: icon,
                type: 'ionicon',
                color: i == value ? activeTabColor : '#000',
              }}
            />
          ),
        )}
      </Tab>
    </>
  )
}
const HeaderComp = ({ websiteUrl, pageTitle }) => {
  const { data } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest.extra.appId) },
  })
  const { data: modalData } = useQuery(NAVIGATION_LINKS, {
    variables: {
      appId: Number(Constants.manifest.extra.appId),
      where: { menuType: { equals: 'modal' } },
    },
  })
  const { data: barData } = useQuery(NAVIGATION_LINKS, {
    variables: {
      appId: Number(Constants.manifest.extra.appId),
      where: { menuType: { equals: 'bar' } },
    },
  })
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

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
  if (layoutTemplate == 'blank')
    return <View style={{ height: insets.top }}></View>

  const isBack = website !== websiteUrl

  return (
    <>
      <StatusBar style={titleTheme !== 'dark' ? 'dark' : 'light'} />

      <Header
        backgroundColor={themeColor}
        leftComponent={
          layoutTemplate == 'drawerBar' || isBack
            ? {
                icon: isBack ? 'arrow-back-outline' : 'menu',
                type: 'ionicon',
                color: titleTheme !== 'dark' ? '#000' : '#fff',
                onPress: () => {
                  isBack
                    ? varWebsiteUrl(website)
                    : //@ts-ignore
                      navigation.toggleDrawer()
                },
              }
            : null
        }
        rightComponent={
          <View style={styles.headerRight}>
            {barData?.links?.nodes.map(
              ({ id, name, type, data, icon }: any) => (
                <TouchableOpacity
                  onPress={() => doAction(type, data, navigation)}
                  key={id}
                  style={{ paddingEnd: 5 }}
                >
                  <Icon
                    name={icon}
                    type="ionicon"
                    color={titleTheme !== 'dark' ? '#000' : '#fff'}
                  />
                </TouchableOpacity>
              ),
            )}
          </View>
        }
        centerComponent={{
          text:
            (data.app.design.disblayPagetitle ? pageTitle : data.app.name) ||
            data.app.name,
          style: {
            ...styles.heading,

            color: titleTheme !== 'dark' ? '#000' : '#fff',
          },
        }}
      />
    </>
  )
}
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer'
import { StatusBar } from 'expo-status-bar'
import { ScrollView } from 'react-native-gesture-handler'

export const DrawerContent = ({ ...props }) => {
  console.log('🚀 ~ file: home.tsx ~ line 331 ~ DrawerContent ~ props', props)
  const insets = useSafeAreaInsets()

  const { data } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest.extra.appId) },
  })
  const { data: modalData } = useQuery(NAVIGATION_LINKS, {
    variables: {
      appId: Number(Constants.manifest.extra.appId),
      where: { menuType: { equals: 'modal' } },
    },
  })

  const navigation = useNavigation()

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
  const {
    backgroundImage,
    color,
    displayLogo,
    drawerMode,
    logo,
    subTitle,
    textTheme,
    title,
  } = data?.app?.design?.AppDesignDrawer || {}
  console.log(
    '🚀 ~ file: home.tsx ~ line 387 ~ DrawerContent ~ displayLogo',
    displayLogo,
  )
  console.log('🚀 ~ file: home.tsx ~ line 387 ~ DrawerContent ~ logo', logo)
  if (layoutTemplate == 'blank') return <></>

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: textTheme !== 'dark' ? '#000' : '#fff' }}
    >
      {drawerMode !== 'notUsed' ? (
        <>
          <ImageBackground
            source={
              drawerMode == 'image' ? { uri: backgroundImage } : undefined
            }
            resizeMode="cover"
            style={{ minHeight: 60, backgroundColor: color }}
          >
            {displayLogo && logo && (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 120,
                }}
              >
                <Image
                  source={{ uri: logo }}
                  containerStyle={{
                    aspectRatio: 1,
                    flex: 1,
                    padding: 0,
                    height: 120,
                  }}
                  style={{ height: 120 }}
                />
              </View>
            )}
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ color: textTheme == 'dark' ? '#000' : '#fff' }} h3>
                {title}
              </Text>
              <Text style={{ color: textTheme == 'dark' ? '#000' : '#fff' }} h4>
                {subTitle}
              </Text>
            </View>
          </ImageBackground>
        </>
      ) : (
        <></>
      )}

      {/* <View style={{ paddingTop: insets.top }}> */}
      {modalData?.links?.nodes.map(({ id, name, type, data, icon }: any) => (
        <ListItem
          bottomDivider
          containerStyle={{
            backgroundColor: textTheme !== 'dark' ? '#000' : '#fff',
          }}
          key={id}
          onPress={() => {
            props.navigation.closeDrawer()
            doAction(type, data, navigation)
          }}
        >
          <Icon
            name={icon}
            type="ionicon"
            color={textTheme == 'dark' ? '#000' : '#fff'}
          />

          <ListItem.Content>
            <ListItem.Title
              style={{ color: textTheme == 'dark' ? '#000' : '#fff' }}
            >
              {name}
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
      ))}
    </DrawerContentScrollView>
  )
}
