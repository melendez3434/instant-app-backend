import { useState } from 'react'
import { StyleSheet, Pressable } from 'react-native'
import { gql, useMutation, useQuery } from '@apollo/client'
import { useNavigation } from '@react-navigation/native'

import React from 'react'

import { APP_INFO } from '../../graphql/query'
import Bottomtabs from '../../components/layout/footer'
import { Button, Image, Input, Text } from '@rneui/themed'
// import {TouchableOpacity} from "react-native-gesture-handler";
import Container from '../../components/common/container'
import { authMutation } from '../../modules/auth/resolvers'
import { getAppid } from '../../utlis/getAppId'

// const varWebsiteUrl = makeVar('')

const LOGIN = gql`
  mutation LOGIN($data: LoginInput!) {
    signinInApp(data: $data) {
      token
      user {
        id
        builderDomain
      }
    }
  }
`

export default function Login() {
  const [login, { loading }] = useMutation(LOGIN)
  const { data, client } = useQuery(APP_INFO, {
    variables: { id: getAppid() },
  })
  const { navigate } = useNavigation()
  const [email, setEmail] = useState('')
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

    if (!password) {
      newErrors = { ...newErrors, password: 'Password is required' }
    }

    setErrors(newErrors || {})

    if (!newErrors) {
      login({
        variables: {
          data: {
            email,
            password,
          },
        },
      })
        .then(async (res) => {
          console.log(res)
          await authMutation.asyncAuth({
            token: res.data.signinInApp.token,
            user: res.data.signinInApp.user,
            client,
          })
          console.log('🚀 ~ file: login.tsx:79 ~ .then ~ res done')

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
        placeholder="Email"
        errorMessage={errors.email}
        onChangeText={(text) => {
          console.log(text)
          setEmail(text)
        }}
        value={email}
      />
      <Input
        placeholder="Password"
        secureTextEntry={true}
        errorMessage={errors.password}
        onChangeText={(text) => {
          console.log(text)
          setPassword(text)
        }}
        value={password}
      />
      <Button
        title="Login"
        buttonStyle={{ width: '100%' }}
        containerStyle={{ width: '100%', paddingHorizontal: 10 }}
        loading={loading}
        onPress={onFinished}
      />
      <Pressable
        onPress={() => {
          //@ts-ignore
          navigate('SignUp')
        }}
      >
        <Text style={{ marginVertical: 30 }}>Create an account</Text>
      </Pressable>

      <Bottomtabs loading={loading} />
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
})
