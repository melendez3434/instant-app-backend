import { allow } from 'graphql-shield'

export const mutationsShield = {
  signup: {
    name: 'signup',
    slug: 'signup',
    desc: '',
    role: ['all'],
    permissions: allow,
  },
  signOut: {
    name: 'signOut',
    slug: 'signOut',
    desc: '',
    plan: 'free',
    role: ['all'],
    permissions: allow,
  },
}
