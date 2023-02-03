import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import React from 'react'

import { Button, Input, Text } from '@rneui/themed'
import Container from '../../components/common/container'

import { varPreviewer } from '../../modules/previewer/defaults'

export default function PreviewerScreen() {
  const [id, setId] = useState('')

  const [errors, setErrors]: any = useState({})

  const onFinished = () => {
    console.log('onFinished')
    let newErrors: any = null

    if (!id) {
      newErrors = { ...newErrors, name: 'App ID is required' }
    }
    setErrors(newErrors || {})

    if (!newErrors) {
      varPreviewer({ id })
    }
  }

  return (
    <Container>
      {/* <HeaderComp centerComponent={'Sign Up'} loading={loading} /> */}
      <View style={[styles.container, styles.center]}>
        <Text h1>App Now Previewer</Text>
      </View>
      <View style={styles.container}>
        {/* <Image
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
      /> */}
        <Input
          placeholder="App ID"
          onChangeText={(text) => {
            console.log(text)
            setId(text)
          }}
          value={id}
          errorMessage={errors.id}
        />

        <Button
          title="Connect"
          onPress={onFinished}
          buttonStyle={{ width: '100%' }}
          containerStyle={{ width: '100%', paddingHorizontal: 10 }}
          // loading={loading}
        />
      </View>
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignContent: 'center',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
  },
})
