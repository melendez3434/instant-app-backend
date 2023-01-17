import { useContext, useEffect, useRef, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  useColorScheme,
  Platform,
  Alert,
} from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import Constants from 'expo-constants'
import { useMutation, useQuery } from '@apollo/client'
import RootNavigation from './navigation/root'
import { ThemeProvider, createTheme, useThemeMode } from '@rneui/themed'
import React from 'react'
import {
  ADD_NOTIFICATION_TOKEN,
  APP_INFO,
  NAVIGATION_LINKS,
} from './graphql/query'
import { WebsiteUrlContextProvider } from './modules'
import * as Device from 'expo-device'
import Toast from 'react-native-toast-message'

import * as Notifications from 'expo-notifications'

const registerForPushNotificationsAsync = async () => {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!')
      return
    }
    const token = (await Notifications.getExpoPushTokenAsync()).data
    console.log(
      '🚀 ~ file: root.tsx:35 ~ registerForPushNotificationsAsync ~ token',
      token,
    )

    return token
  } else {
    alert('Must use physical device for Push Notifications')
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }
}
export default function MyRoot() {
  const [setExpoPushToken, { error: tokenError }] = useMutation(
    ADD_NOTIFICATION_TOKEN,
  )

  const { data, loading } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest?.extra?.appId) },
  })
  const { loading: mainLinksLoading } = useQuery(NAVIGATION_LINKS, {
    variables: {
      appId: Number(Constants.manifest?.extra?.appId),
      where: { menuType: { equals: 'main' } },
    },
  })
  const { loading: madalLinksLoading } = useQuery(NAVIGATION_LINKS, {
    variables: {
      appId: Number(Constants.manifest.extra.appId),
      where: { menuType: { equals: 'modal' } },
    },
  })
  const { loading: barLinksLoading } = useQuery(NAVIGATION_LINKS, {
    variables: {
      appId: Number(Constants.manifest.extra.appId),
      where: { menuType: { equals: 'bar' } },
    },
  })
  const finalLoading =
    mainLinksLoading || loading || madalLinksLoading || barLinksLoading
  console.log(
    '🚀 ~ file: root.tsx:82 ~ MyRoot ~  Number(Constants.manifest.extra.appId)',
    Number(Constants.manifest.extra.appId),
  )

  const { setMode } = useThemeMode()
  useEffect(() => {
    if (data?.app) {
      setTimeout(() => {
        SplashScreen.hideAsync()
      }, data.app.assets.delay || 200)
    }
  }, [loading])
  React.useEffect(() => {
    data?.app?.design?.textTheme &&
      setMode(data.app.design.textTheme == 'light' ? 'dark' : 'light')
  }, [data])

  const notificationListener = useRef()
  const responseListener = useRef()
  React.useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken({
        variables: { token, id: Number(Constants.manifest.extra.appId) },
      }),
    )

    // This listener is fired whenever a notification is received while the app is foregrounded
    //@ts-ignore
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        Toast.show({
          type: 'success',
          text1: notification?.request.content.title || 'notification',
          text2: notification?.request.content.body || 'notification body',
        })

        console.log(
          '🚀 ~ file: root.tsx:108 ~ Notifications.addNotificationReceivedListener ~ notification',
          JSON.stringify(notification, undefined, 2),
        )

        // setNotification(notification)
      })

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    //@ts-ignore
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          '🚀 ~ file: root.tsx:116 ~ Notifications.addNotificationResponseReceivedListener ~ response',
          response,
        )
        // console.log(response)
      })

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current)
      Notifications.removeNotificationSubscription(responseListener.current)
    }
  }, [])
  if (!data?.app || finalLoading) return <ActivityIndicator />
  console.log(
    '🚀 ~ file: root.tsx ~ line 39 ~ MyRoot ~ data.app.design.textTheme',
    data.app.design.titleTheme,
  )

  const theme = createTheme({
    lightColors: {
      primary: data.app.design.themeColor,
    },
    darkColors: {
      primary: data.app.design.themeColor,
      //   primary: '#344512',
    },
    mode: data.app.design.titleTheme == 'light' ? 'dark' : 'light',
  })

  return (
    <View style={styles.container}>
      <WebsiteUrlContextProvider>
        <ThemeProvider theme={theme}>
          <RootNavigation />
        </ThemeProvider>
      </WebsiteUrlContextProvider>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webContainer: {},
})
