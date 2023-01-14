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

// const varWebsiteUrl = makeVar('')

const SIGN_UP = gql`
  mutation SignUp($data: SignUpInput!) {
    signUpInApp(data: $data) {
      token
      user {
        id
      }
    }
  }
`

export default function SignUp() {
  const [signUp, { loading }] = useMutation(SIGN_UP)
  const { data } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest.extra.appId) },
  })
  const { navigate } = useNavigation()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const [password, setPassword] = useState('')
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
      />
      <Input
        placeholder="Email"
        onChangeText={(text) => {
          console.log(text)
          setEmail(text)
        }}
        value={email}
      />
      <Input
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={(text) => {
          console.log(text)
          setPassword(text)
        }}
        value={password}
      />
      <Button
        title="Signup"
        buttonStyle={{ width: '100%' }}
        containerStyle={{ width: '100%', paddingHorizontal: 10 }}
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
