import { StyleSheet, View } from 'react-native'

import React from 'react'

import { useTheme } from '@rneui/themed'
import { StatusBar } from 'expo-status-bar'
import Constants from 'expo-constants'
import { useQuery } from '@apollo/client'
import { APP_INFO } from '../../graphql/query'

export default function Container({ children, style }) {
  const { theme } = useTheme()
  const { data } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest.extra.appId) },
  })
  const { titleTheme } = data?.app?.design || {}
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style,
      ]}
    >
      <StatusBar style={titleTheme == 'dark' ? 'dark' : 'light'} />

      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
