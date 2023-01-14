import * as React from 'react'
import SignUp from '../screens/auth/signup'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Login from '../screens/auth/login'

const Stack = createNativeStackNavigator()

function AuthNavigation() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        options={{ headerShown: false }}
        name="Login"
        component={Login}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="SignUp"
        component={SignUp}
      />
    </Stack.Navigator>
  )
}

export default AuthNavigation
