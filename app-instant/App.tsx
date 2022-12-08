import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Platform } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import MyRoot from './src/root'
import { NavigationContainer } from '@react-navigation/native'
import React, { useEffect, useRef } from 'react'

const endpointDev = 'https://instantappnow-dev.herokuapp.com/graphql'
// const endpointDev = 'http://localhost:4000/graphql'

SplashScreen.preventAutoHideAsync()
// Initialize Apollo Client
const client = new ApolloClient({
  uri: endpointDev,
  cache: new InMemoryCache(),
})

export default function App() {
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
