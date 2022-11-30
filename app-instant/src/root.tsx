import { useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  useColorScheme,
} from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import Constants from 'expo-constants'
import { useQuery } from '@apollo/client'
import RootNavigation from './navigation/root'
import { ThemeProvider, createTheme, useThemeMode } from '@rneui/themed'
import React from 'react'
import { APP_INFO, NAVIGATION_LINKS } from './graphql/query'

export default function MyRoot() {
  const { data, loading, error } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest?.extra?.appId) },
  })
  const { loading: mainLinksLoading } = useQuery(NAVIGATION_LINKS, {
    variables: {
      id: Number(Constants.manifest?.extra?.appId),
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
  console.log('🚀 ~ file: root.tsx ~ line 65 ~ MyRoot ~ error', error)
  console.log('🚀 ~ file: root.tsx ~ line 65 ~ MyRoot ~ data', data)
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

  if (!data?.app || finalLoading) return <ActivityIndicator />
  console.log(
    '🚀 ~ file: root.tsx ~ line 39 ~ MyRoot ~ data.app.design.textTheme',
    data.app.design.titleTheme,
  )

  const theme = createTheme({
    lightColors: {
      primary: data.app.design.themeColor,
    },
    // darkColors: {
    //   primary: data.app.design.themeColor,
    //   //   primary: '#344512',
    // },
    mode: data.app.design.titleTheme == 'light' ? 'dark' : 'light',
  })

  return (
    <View style={styles.container}>
      <ThemeProvider theme={theme}>
        <RootNavigation />
      </ThemeProvider>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webContainer: {},
})
