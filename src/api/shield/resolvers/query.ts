import { allow } from 'graphql-shield'

export const queriesShield = {
  me: {
    name: 'me',
    slug: 'me',
    desc: '',
    role: ['all'],
    permissions: allow,
  },
}
