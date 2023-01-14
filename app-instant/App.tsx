import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Platform } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  from,
  HttpLink,
} from '@apollo/client'
import MyRoot from './src/root'
import { NavigationContainer } from '@react-navigation/native'
import React, { useEffect, useRef } from 'react'
import Constants from 'expo-constants'
import Toast from 'react-native-toast-message'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

const endpointDev = Constants.manifest?.extra.isDev
  ? 'https://instantappnow-dev.herokuapp.com/graphql'
  : 'https://instantappnow.herokuapp.com/graphql'
// const endpointDev = 'http://localhost:4000/graphql'
console.log('🚀 ~ file: App.tsx:11 ~ endpointDev', endpointDev)

SplashScreen.preventAutoHideAsync()
const httpLink = new HttpLink({
  credentials: 'include',
  fetch, // Switches between unfetch & node-fetch for client & server.
  uri: endpointDev,
})
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.map(({ message: msg }) => {
      // message.error(msg);
      Toast.show({
        text1: msg,
        type: 'error',
      })
    })
  }
  if (networkError) {
    // showMessage({
    //   message: networkError.message,
    //   type: 'danger',
    // });
  }
})
const contextLinkForCreateApolloClient = setContext(() => {
  // const shop =
  //   process.env.NODE_ENV !== "development"
  //     ? !ssrMode && window.location.hostname
  //     : DEFAULT_BUILDER;
  const headers: any = {
    // authorization: varAuth()?.token ? `bearer ${varAuth().token}` : "",
    appId: Number(Constants.manifest?.extra?.appId),
  }

  return {
    headers,
  }
})
// Initialize Apollo Client
const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: from([errorLink, contextLinkForCreateApolloClient, httpLink]),
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
