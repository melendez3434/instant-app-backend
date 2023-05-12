// In App.js in a new project

import * as React from 'react'
import { View, Text } from 'react-native'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeNavigation from './home'
import SignUp from '../screens/auth/signup'
import AuthNavigation from './auth'
import { useVarAuth } from '../modules/auth/defaults'
import { APP_INFO } from '../graphql/query'
import { useQuery } from '@apollo/client'
import MyAccountNavigation from './myAccount'
import { getAppid } from '../utlis/getAppId'

const Stack = createNativeStackNavigator()

function RootNavigation() {
  const { isLogin } = useVarAuth()
  console.log('🚀 ~ file: root.tsx:20 ~ RootNavigation ~ isLogin:', isLogin)
  const { navigate } = useNavigation()
  const { data, loading } = useQuery(APP_INFO, {
    variables: { id: getAppid() },
  })
  React.useEffect(() => {
    if (isLogin) {
      navigate('HomeStack')
    }
  }, [isLogin])

  return (
    <Stack.Navigator>
      {!isLogin && data.app.mustAuth && (
        <Stack.Screen
          name="LoginStack"
          options={{ headerShown: false }}
          component={AuthNavigation}
        />
      )}

      <Stack.Screen
        name="HomeStack"
        options={{ headerShown: false }}
        component={HomeNavigation}
      />
      {!isLogin && !data.app.mustAuth && (
        <Stack.Screen
          name="LoginStack"
          options={{ headerShown: false }}
          component={AuthNavigation}
        />
      )}
      <Stack.Screen
        name="MyAccountStack"
        options={{ headerShown: false }}
        component={MyAccountNavigation}
      />
    </Stack.Navigator>
  )
}

export default RootNavigation
