// In App.js in a new project

import * as React from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import HomeScreen, { DrawerContent } from '../screens/home'
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

const Drawer = createDrawerNavigator()

function HomeNavigation() {
  return (
    <Drawer.Navigator initialRouteName="Home" drawerContent={DrawerContent}>
      <Drawer.Screen
        options={{ headerShown: false }}
        // name="BottomTabs"
        // component={BottomTabs}
        name="Home"
        component={HomeScreen}
      />
    </Drawer.Navigator>
  )
}

// const Tab = createBottomTabNavigator()
// function BottomTabs() {
//   return (
//     <Tab.Navigator>
//       <Tab.Screen name="Home" component={HomeScreen} />
//     </Tab.Navigator>
//   )
// }
export default HomeNavigation
