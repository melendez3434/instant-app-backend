import { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import { gql, useMutation, useQuery } from '@apollo/client'
import { WebView } from 'react-native-webview'
import { useNavigation } from '@react-navigation/native'

import React from 'react'

import HeaderComp from '../../components/layout/header'
import { APP_INFO } from '../../graphql/query'
import Bottomtabs from '../../components/layout/footer'
import { Button, Image, Input, Text } from '@rneui/themed'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Container from '../../components/common/container'
import { authMutation } from '../../modules/auth/resolvers'
import { useVarAuth, varAuth } from '../../modules/auth/defaults'
import { EDIT_PROFILE } from './editProfile'
import Toast from 'react-native-toast-message'
import { getAppid } from '../../utlis/getAppId'

// const varWebsiteUrl = makeVar('')

export default function ChangePassword() {
  const [editProfile, { loading }] = useMutation(EDIT_PROFILE)
  const { data, client } = useQuery(APP_INFO, {
    variables: { id: getAppid() },
  })
  const { user } = useVarAuth()
  const { navigate } = useNavigation()
  const [pass, setPass] = useState('')
  const [newPass, setNewPass] = useState('')

  const [errors, setErrors]: any = useState({})

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
  const onFinished = () => {
    console.log('onFinished')
    let newErrors: any = null

    if (!pass) {
      newErrors = { ...newErrors, pass: 'Password is required' }
    }

    if (!newPass) {
      newErrors = { ...newErrors, newPass: 'New Password is required' }
    }
    setErrors(newErrors || {})

    if (!newErrors) {
      editProfile({
        variables: {
          data: {
            pass,
            newPass,
          },
        },
      })
        .then(async (res) => {
          console.log(res)

          //@ts-ignore
          //   navigate('HomeStack', { screen: 'Home' })
          Toast.show({ text1: 'Password Changed Successfully' })
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }

  return (
    <Container style={styles.container}>
      <HeaderComp
        centerComponent={<Text h4>Change Password </Text>}
        leftComponent={<></>}
        loading={loading}
      />

      <Input
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={(text) => {
          console.log(text)
          setPass(text)
        }}
        value={pass}
        errorMessage={errors.pass}
      />
      <Input
        placeholder="New Password"
        secureTextEntry={true}
        onChangeText={(text) => {
          console.log(text)
          setNewPass(text)
        }}
        value={newPass}
        errorMessage={errors.newPass}
      />

      <Button
        title="Save"
        onPress={onFinished}
        buttonStyle={{ width: '100%' }}
        containerStyle={{ width: '100%', paddingHorizontal: 10 }}
        loading={loading}
      />

      <Bottomtabs loading={loading} />
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignContent: 'center',
    alignItems: 'center',
    // justifyContent: 'center',
  },
})
