import { gql } from '@apollo/client'

export const CURRENT_CUSTOMER = gql`
  query CURRENT_CUSTOMER {
    me {
      id
      email
      name
      role
    }
  }
`
