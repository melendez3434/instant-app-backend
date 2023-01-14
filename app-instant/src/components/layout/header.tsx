import { StyleSheet, View, TouchableOpacity } from 'react-native'
import Constants from 'expo-constants'
import { useQuery } from '@apollo/client'
import { useNavigation } from '@react-navigation/native'
import { Icon, Header, LinearProgress } from '@rneui/themed'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import React from 'react'

import { useWebsiteUrl } from '../../modules'
import { APP_INFO, NAVIGATION_LINKS } from '../../graphql/query'
import { doAction } from '../../utlis/doAction'

const HeaderComp = ({
  websiteUrl,
  pageTitle,
  loading,
  leftComponent,
  centerComponent,
  rightComponent,
}: {
  websiteUrl?
  pageTitle?
  loading?
  leftComponent?
  centerComponent?
  rightComponent?
}) => {
  const { data } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest.extra.appId) },
  })
  const { varWebsiteUrl } = useWebsiteUrl()

  const { data: barData } = useQuery(NAVIGATION_LINKS, {
    variables: {
      appId: Number(Constants.manifest.extra.appId),
      where: { menuType: { equals: 'bar' } },
    },
  })
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const {
    themeColor,
    titleTheme,
    progressIndicator,
    disblayPagetitle,
    progressIndicatorColor,
    pullToRefresh,
    activeTabColor,
    navigationActiveColor,
    layoutTemplate,
  } = data?.app?.design || {}

  const { website } = data?.app || {}
  if (layoutTemplate == 'blank')
    return <View style={{ height: insets.top }}></View>

  const isBack = website !== websiteUrl
  const goBack = () => {
    if (isBack) {
      !websiteUrl ? navigation.goBack() : varWebsiteUrl(website)
    } else {
      //@ts-ignore
      navigation.toggleDrawer()
    }
  }
  return (
    <>
      <Header
        backgroundColor={themeColor}
        leftComponent={
          leftComponent ||
          (layoutTemplate == 'drawerBar' || isBack
            ? {
                icon: isBack ? 'arrow-back-outline' : 'menu',
                type: 'ionicon',
                color: titleTheme !== 'dark' ? '#000' : '#fff',
                onPress: goBack,
              }
            : null)
        }
        rightComponent={
          rightComponent || (
            <View style={styles.headerRight}>
              {barData?.links?.nodes.map(
                ({ id, name, type, data, icon }: any) => (
                  <TouchableOpacity
                    onPress={() =>
                      doAction(type, data, navigation, varWebsiteUrl)
                    }
                    key={id}
                    style={{ paddingEnd: 5 }}
                  >
                    <Icon
                      name={icon}
                      type="ionicon"
                      color={titleTheme !== 'dark' ? '#000' : '#fff'}
                    />
                  </TouchableOpacity>
                ),
              )}
            </View>
          )
        }
        centerComponent={
          centerComponent || {
            text:
              (data.app.design.disblayPagetitle ? pageTitle : data.app.name) ||
              data.app.name,
            style: {
              ...styles.heading,

              color: titleTheme !== 'dark' ? '#000' : '#fff',
            },
          }
        }
      />
      {progressIndicator == 'linear' && loading && (
        <LinearProgress color={progressIndicatorColor} />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 5,
  },
})
export default HeaderComp
