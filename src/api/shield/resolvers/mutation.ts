import { allow } from 'graphql-shield'
import { isAuth } from '../rules'

export const mutationsShield = {
  signup: {
    name: 'signup',
    slug: 'signup',
    desc: '',
    role: ['all'],
    permissions: allow,
  },
  signin: {
    name: 'signin',
    slug: 'signin',
    desc: '',
    role: ['all'],
    permissions: allow,
  },
  signOut: {
    name: 'signOut',
    slug: 'signOut',
    desc: '',
    role: ['all'],
    permissions: allow,
  },
  updateMyProfile: {
    name: 'updateMyProfile',
    slug: 'updateMyProfile',
    desc: '',
    role: ['all'],
    permissions: isAuth,
  },
}
