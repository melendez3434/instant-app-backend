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
import Toast from 'react-native-toast-message'
import { getAppid } from '../../utlis/getAppId'

// const varWebsiteUrl = makeVar('')

export const EDIT_PROFILE = gql`
  mutation EDIT_PROFILE($data: updateMyProfileInput!) {
    updateMyProfile(data: $data) {
      id
    }
  }
`

export default function Profile() {
  const [editProfile, { loading }] = useMutation(EDIT_PROFILE)
  const { data, client } = useQuery(APP_INFO, {
    variables: { id: getAppid() },
  })
  const { user } = useVarAuth()
  const { navigate } = useNavigation()
  const [email, setEmail] = useState(user.email)
  const [name, setName] = useState(user.name)

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
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      newErrors = {
        ...newErrors,
        email: 'You have entered an invalid email address!',
      }
    }
    if (!email) {
      newErrors = { ...newErrors, email: 'Email is required' }
    }

    if (!name) {
      newErrors = { ...newErrors, name: 'Name is required' }
    }
    setErrors(newErrors || {})

    if (!newErrors) {
      editProfile({
        variables: {
          data: {
            email,
            name,
          },
        },
      })
        .then(async (res) => {
          console.log(res)
          varAuth({
            ...varAuth(),
            user: {
              ...user,
              name,
              email,
            },
          })
          Toast.show({ text1: 'Profile updated successfully', type: 'success' })
          //@ts-ignore
          //   navigate('HomeStack', { screen: 'Home' })
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }

  return (
    <Container style={styles.container}>
      <HeaderComp
        centerComponent={<Text h4>Profile </Text>}
        leftComponent={<></>}
        loading={loading}
      />

      <Input
        placeholder="Name"
        onChangeText={(text) => {
          console.log(text)
          setName(text)
        }}
        value={name}
        errorMessage={errors.name}
      />
      <Input
        placeholder="Email"
        onChangeText={(text) => {
          console.log(text)
          setEmail(text)
        }}
        value={email}
        errorMessage={errors.email}
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
