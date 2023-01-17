import { StyleSheet, View } from 'react-native'

import React, { useEffect } from 'react'

import Bottomtabs from '../../components/layout/footer'

import Container from '../../components/common/container'
import HeaderComp from '../../components/layout/header'
import { Icon, Image, ListItem, Text, useTheme } from '@rneui/themed'
import { useQuery } from '@apollo/client'
import { APP_INFO } from '../../graphql/query'
import Constants from 'expo-constants'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useNavigation } from '@react-navigation/native'
import { authMutation } from '../../modules/auth/resolvers'
import { useVarAuth } from '../../modules/auth/defaults'

export default function MyAccount() {
  const { theme } = useTheme()
  const { data, client } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest.extra.appId) },
  })
  const { navigate } = useNavigation()
  const { isLogin } = useVarAuth()
  const {
    backgroundImage,
    color,
    displayLogo,
    drawerMode,
    logo,
    subTitle,
    textTheme,
    title,
  } = data?.app?.design?.AppDesignDrawer || {}

  useEffect(() => {
    if (!isLogin) {
      //@ts-ignore
      navigate('LoginStack', { screen: 'Login' })
    }
  }, [isLogin])
  if (!isLogin) return null
  return (
    <Container style={styles.container}>
      <HeaderComp
        centerComponent={<Text h4>My Account</Text>}
        leftComponent={<></>}
      />
      <View style={{ alignItems: 'center' }}>
        <Image
          source={{
            uri: logo,
          }}
          style={{
            width: 200,
            height: 100,
            alignSelf: 'center',
            marginTop: 50,
            marginBottom: 40,
          }}
        />
      </View>
      <>
        {/* @ts-ignore */}
        <TouchableOpacity onPress={() => navigate('Profile')}>
          <ListItem>
            <ListItem.Content>
              <ListItem.Title>Profile</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        </TouchableOpacity>
        {/* @ts-ignore */}
        <TouchableOpacity onPress={() => navigate('ChangePassword')}>
          <ListItem>
            <ListItem.Content>
              <ListItem.Title>Change Password</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => authMutation.signout(client)}>
          <ListItem>
            <ListItem.Content>
              <ListItem.Title style={{ color: theme.colors.error }}>
                Sign Out
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron color={theme.colors.error} />
          </ListItem>
        </TouchableOpacity>
      </>
      <Bottomtabs />
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {},
})
