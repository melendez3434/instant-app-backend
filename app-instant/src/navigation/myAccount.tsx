import * as React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MyAccount from '../screens/account'
import Profile from '../screens/account/editProfile'

const Stack = createNativeStackNavigator()

function MyAccountNavigation() {
  return (
    <Stack.Navigator initialRouteName="MyAccount">
      <Stack.Screen
        options={{ headerShown: false }}
        name="MyAccount"
        component={MyAccount}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="Profile"
        component={Profile}
      />
    </Stack.Navigator>
  )
}

export default MyAccountNavigation
