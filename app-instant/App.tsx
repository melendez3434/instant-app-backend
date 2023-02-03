import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Platform } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import Constants from 'expo-constants'
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
import Toast from 'react-native-toast-message'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { varAuth } from './src/modules/auth/defaults'
import { getAppid, getEndPoint } from './src/utlis/getAppId'
import useCachedResources from './src/hooks/useCachedResources'
import { useVarPreviewer, varPreviewer } from './src/modules/previewer/defaults'
import PreviewerScreen from './src/screens/previewer'
import { Button } from '@rneui/themed'

const endpointDev = getEndPoint()

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
  console.log(
    '🚀 ~ file: App.tsx:59 ~ contextLinkForCreateApolloClient ~ varAuth()',
    varAuth(),
  )

  const headers: any = {
    authorization: varAuth()?.token ? `bearer ${varAuth().token}` : '',
    appId: getAppid(),
    builderDomain: varAuth()?.user?.builderDomain,
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
  const isLoadingComplete = useCachedResources()
  const { id } = useVarPreviewer()
  console.log('🚀 ~ file: App.tsx:5 ~ Constants', Constants)

  if (!isLoadingComplete) {
    return null
  } else {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <ApolloProvider client={client}>
            {!id &&
            Constants.manifest?.extra?.isPreview &&
            Platform.OS !== 'web' ? (
              // Platform.OS !== 'web' &&
              // Constants.manifest?.android?.package == 'previewer.now.app'
              <PreviewerScreen />
            ) : (
              <MyRoot />
            )}
            {id && Constants.manifest?.extra?.isPreview && (
              <Button
                // buttonStyle={{
                //   position: 'absolute',
                //   top: 0,
                //   right: 0,
                //   zIndex: 999,
                // }}
                onPress={() => {
                  varPreviewer({
                    id: null,
                  })
                }}
              >
                Clear Preview
              </Button>
            )}
            <Toast />
            <StatusBar style="auto" />
          </ApolloProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    )
  }
}

const styles = StyleSheet.create({})
