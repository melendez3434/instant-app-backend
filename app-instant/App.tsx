import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Platform } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import MyRoot from './src/root'
import { NavigationContainer } from '@react-navigation/native'
import React, { useEffect, useRef } from 'react'
import Constants from 'expo-constants'
import Toast from 'react-native-toast-message'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const endpointDev = Constants.manifest?.extra.isDev
  ? 'https://instantappnow-dev.herokuapp.com/graphql'
  : 'https://instantappnow.herokuapp.com/graphql'
// const endpointDev = 'http://localhost:4000/graphql'
console.log('🚀 ~ file: App.tsx:11 ~ endpointDev', endpointDev)

SplashScreen.preventAutoHideAsync()
// Initialize Apollo Client
const client = new ApolloClient({
  uri: endpointDev,
  cache: new InMemoryCache(),
})

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <ApolloProvider client={client}>
          <MyRoot />
          <Toast />

          <StatusBar style="auto" />
        </ApolloProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({})
