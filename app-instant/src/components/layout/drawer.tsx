import { View, ImageBackground } from 'react-native'
import Constants from 'expo-constants'
import { useQuery } from '@apollo/client'
import { useNavigation } from '@react-navigation/native'
import { Text, Icon, ListItem, Image } from '@rneui/themed'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import React from 'react'

import { DrawerContentScrollView } from '@react-navigation/drawer'
import { APP_INFO, NAVIGATION_LINKS } from '../../graphql/query'
import { useWebsiteUrl } from '../../modules'
import { doAction } from '../../utlis/doAction'

export const DrawerContent = ({ ...props }) => {
  const { data } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest.extra.appId) },
  })
  const { data: modalData } = useQuery(NAVIGATION_LINKS, {
    variables: {
      appId: Number(Constants.manifest.extra.appId),
      where: { menuType: { equals: 'modal' } },
    },
  })
  const { varWebsiteUrl } = useWebsiteUrl()

  const navigation = useNavigation()

  const { layoutTemplate } = data?.app?.design || {}
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
  console.log(
    '🚀 ~ file: home.tsx ~ line 387 ~ DrawerContent ~ displayLogo',
    displayLogo,
  )
  console.log('🚀 ~ file: home.tsx ~ line 387 ~ DrawerContent ~ logo', logo)
  if (layoutTemplate == 'blank') return <></>

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: textTheme !== 'dark' ? '#000' : '#fff' }}
    >
      {drawerMode !== 'notUsed' ? (
        <>
          <ImageBackground
            source={
              drawerMode == 'image' ? { uri: backgroundImage } : undefined
            }
            resizeMode="cover"
            style={{ minHeight: 60, backgroundColor: color }}
          >
            {displayLogo && logo && (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 120,
                }}
              >
                <Image
                  source={{ uri: logo }}
                  containerStyle={{
                    aspectRatio: 1,
                    flex: 1,
                    padding: 0,
                    height: 120,
                  }}
                  style={{ height: 120 }}
                />
              </View>
            )}
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ color: textTheme == 'dark' ? '#000' : '#fff' }} h3>
                {title}
              </Text>
              <Text style={{ color: textTheme == 'dark' ? '#000' : '#fff' }} h4>
                {subTitle}
              </Text>
            </View>
          </ImageBackground>
        </>
      ) : (
        <></>
      )}

      {/* <View style={{ paddingTop: insets.top }}> */}
      {modalData?.links?.nodes.map(({ id, name, type, data, icon }: any) => (
        <ListItem
          bottomDivider
          containerStyle={{
            backgroundColor: textTheme !== 'dark' ? '#000' : '#fff',
          }}
          key={id}
          onPress={() => {
            props.navigation.closeDrawer()
            doAction(type, data, navigation, varWebsiteUrl)
          }}
        >
          <Icon
            name={icon}
            type="ionicon"
            color={textTheme == 'dark' ? '#000' : '#fff'}
          />

          <ListItem.Content>
            <ListItem.Title
              style={{ color: textTheme == 'dark' ? '#000' : '#fff' }}
            >
              {name}
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
      ))}
    </DrawerContentScrollView>
  )
}
