import { gql } from '@apollo/client'

export const APP_INFO = gql`
  query APP_INFO($id: Int!) {
    app(id: $id) {
      id
      name
      website
      #   appId
      userAgent
      #   nextBill
      lang
      #   planStatus
      assets {
        id
        logo
        # appIcon
        # backgroundImage
        # color
        delay
        displayLogo
        # splashMode
        tagLine
        textThemeMode
      }
      design {
        id
        themeColor
        titleTheme
        progressIndicator
        disblayPagetitle
        progressIndicatorColor
        pullToRefresh
        activeTabColor
        navigationActiveColor
        layoutTemplate
        AppDesignDrawer {
          id
          backgroundImage
          color
          displayLogo
          drawerMode
          logo
          subTitle
          textTheme
          title
        }
      }
    }
  }
`
export const NAVIGATION_LINKS = gql`
  query NAVIGATION_LINKS($appId: Int!, $where: LinkWhereInput) {
    links(appId: $appId, where: $where, take: 100) {
      nodes {
        id
        name
        type
        data
        icon
      }
    }
  }
`
export const ADD_NOTIFICATION_TOKEN = gql`
  mutation ADD_NOTIFICATION_TOKEN($id: Int!, $token: String!) {
    addNotificationToken(id: $id, token: $token)
  }
`
