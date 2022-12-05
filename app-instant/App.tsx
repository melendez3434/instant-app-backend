import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Platform } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import MyRoot from './src/root'
import { NavigationContainer } from '@react-navigation/native'
import React, { useRef } from 'react'
import * as Device from 'expo-device'

import * as Notifications from 'expo-notifications'

const endpointDev = 'https://instantappnow-dev.herokuapp.com/graphql'
// const endpointDev = 'http://localhost:4000/graphql'

SplashScreen.preventAutoHideAsync()
// Initialize Apollo Client
const client = new ApolloClient({
  uri: endpointDev,
  cache: new InMemoryCache(),
})

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
    console.log(token)
    this.setState({ expoPushToken: token })
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
export default function App() {
  const notificationListener = useRef()
  const responseListener = useRef()
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token))

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification)
      })

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response)
      })

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current)
      Notifications.removeNotificationSubscription(responseListener.current)
    }
  }, [])
  return (
    <NavigationContainer>
      <ApolloProvider client={client}>
        <MyRoot />
        <StatusBar style="auto" />
      </ApolloProvider>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({})
