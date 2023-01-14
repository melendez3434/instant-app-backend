// In App.js in a new project

import * as React from 'react'
import { View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeNavigation from './home'
import SignUp from '../screens/auth/signup'
import AuthNavigation from './auth'

const Stack = createNativeStackNavigator()

function RootNavigation() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LoginStack"
        options={{ headerShown: false }}
        component={AuthNavigation}
      />
      <Stack.Screen
        name="HomeStack"
        options={{ headerShown: false }}
        component={HomeNavigation}
      />
    </Stack.Navigator>
  )
}

export default RootNavigation
