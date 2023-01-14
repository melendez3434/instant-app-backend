import Constants from 'expo-constants'
import { useQuery } from '@apollo/client'
import { useNavigation } from '@react-navigation/native'
import { Tab } from '@rneui/themed'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import React from 'react'
import { useWebsiteUrl } from '../../modules'
import { APP_INFO, NAVIGATION_LINKS } from '../../graphql/query'
import { doAction } from '../../utlis/doAction'
import { ActivityIndicator, useWindowDimensions } from 'react-native'

const Bottomtabs = ({ loading }) => {
  const [value, setValue] = React.useState(0)
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { varWebsiteUrl } = useWebsiteUrl()
  const { height, width } = useWindowDimensions()

  const {
    data,
    loading: linksLoading,
    error,
    refetch,
  } = useQuery(NAVIGATION_LINKS, {
    variables: {
      appId: Number(Constants.manifest.extra.appId),
      where: { menuType: { equals: 'main' } },
    },
  })
  console.log('🚀 ~ file: home.tsx ~ line 123 ~ Bottomtabs ~ error', error)
  console.log('🚀 ~ file: home.tsx ~ line 123 ~ Bottomtabs ~ data', data)
  const { data: dataApp } = useQuery(APP_INFO, {
    variables: { id: Number(Constants.manifest.extra.appId) },
  })
  const {
    activeTabColor,
    layoutTemplate,
    progressIndicator,
    progressIndicatorColor,
  } = dataApp?.app?.design || {}

  // if (loading || !data?.links?.nodes?.length) return <></>;
  if (layoutTemplate !== 'tabBar') return <></>

  return (
    <>
      {progressIndicator == 'circular' && loading && (
        <ActivityIndicator
          color={progressIndicatorColor}
          style={{ position: 'absolute', top: height / 2, left: width / 2 }}
          size="large"
        />
      )}
      <Tab
        value={value}
        onChange={(e) => {
          setValue(e)
          const item = data?.links?.nodes[e]
          doAction(item.type, item.data, navigation, varWebsiteUrl)
        }}
        indicatorStyle={{
          backgroundColor: activeTabColor,
          height: 3,
        }}
        style={{ marginBottom: Math.max(insets.bottom, 16) }}
        // variant="primary"
      >
        {data?.links?.nodes.map(
          ({ id, name, type, data, icon }: any, i: number) => (
            <Tab.Item
              key={id}
              onPress={() => doAction(type, data, navigation, varWebsiteUrl)}
              title={name}
              titleStyle={{
                fontSize: 12,
                color: i == value ? activeTabColor : '#000',
              }}
              icon={{
                name: icon,
                type: 'ionicon',
                color: i == value ? activeTabColor : '#000',
              }}
            />
          ),
        )}
      </Tab>
    </>
  )
}

export default Bottomtabs
