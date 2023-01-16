import { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import Constants from 'expo-constants'
import { gql, useMutation, useQuery } from '@apollo/client'
import { WebView } from 'react-native-webview'
import { useNavigation } from '@react-navigation/native'

import React from 'react'

import HeaderComp from '../../components/layout/header'
import { APP_INFO } from '../../graphql/query'
import Bottomtabs from '../../components/layout/footer'
import LoginScreen from 'react-native-login-screen'
import { Button, Image, Input, Text } from '@rneui/themed'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Container from '../../components/common/container'
import { authMutation } from '../../modules/auth/resolvers'

// const varWebsiteUrl = makeVar('')

const SIGN_UP = gql`
  mutation SignUp($data: SignUpInput!) {
    signupInApp(data: $data) {
      token
      user {
        id
      }
    }
  }
`

export default function SignUp() {
  const [signUp, { loading }] = useMutation(SIGN_UP)
  const { data, client } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest.extra.appId) },
  })
  const { navigate } = useNavigation()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const [password, setPassword] = useState('')
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
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      newErrors = {
        ...newErrors,
        email: 'You have entered an invalid email address!',
      }
    }
    if (!email) {
      newErrors = { ...newErrors, email: 'Email is required' }
    }
    if (!password) {
      newErrors = { ...newErrors, password: 'Password is required' }
    }
    if (!name) {
      newErrors = { ...newErrors, name: 'Name is required' }
    }
    setErrors(newErrors || {})

    if (email && password && name) {
      signUp({
        variables: {
          data: {
            email,
            password,
            name,
          },
        },
      })
        .then(async (res) => {
          console.log(res)
          await authMutation.asyncAuth({
            token: res.data.signupInApp.token,
            client,
          })
          //@ts-ignore
          navigate('HomeStack', { screen: 'Home' })
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }

  return (
    <Container style={styles.container}>
      {/* <HeaderComp centerComponent={'Sign Up'} loading={loading} /> */}

      <Image
        source={{
          uri: logo,
        }}
        style={{
          width: 200,
          height: 100,
          alignSelf: 'center',
          marginTop: 200,
          marginBottom: 40,
        }}
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
      <Input
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={(text) => {
          console.log(text)
          setPassword(text)
        }}
        errorMessage={errors.password}
        value={password}
      />
      <Button
        title="Signup"
        onPress={onFinished}
        buttonStyle={{ width: '100%' }}
        containerStyle={{ width: '100%', paddingHorizontal: 10 }}
        loading={loading}
      />
      <TouchableOpacity
        onPress={() => {
          //@ts-ignore
          navigate('Login')
        }}
      >
        <Text style={{ marginVertical: 30 }}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>

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
