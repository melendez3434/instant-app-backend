import { StyleSheet, View } from 'react-native'

import React from 'react'

import { useTheme } from '@rneui/themed'
import { StatusBar } from 'expo-status-bar'
import { useQuery } from '@apollo/client'
import { APP_INFO } from '../../graphql/query'
import { getAppid } from '../../utlis/getAppId'

export default function Container({ children, style }) {
  const { theme } = useTheme()
  const { data, error } = useQuery(APP_INFO, {
    variables: { id: getAppid() },
  })
  console.log('🚀 ~ file: container.tsx:16 ~ Container ~ error', error)
  const { titleTheme } = data?.app?.design || {}
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme?.colors?.background },
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
