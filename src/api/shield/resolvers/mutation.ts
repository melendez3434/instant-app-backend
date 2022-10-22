import { allow } from 'graphql-shield'
import { isAppOwner, isAppOwnerFromLink, isAuth } from '../rules'

const appMutationsShield = {
  addApp: {
    name: 'addApp',
    slug: 'addApp',
    desc: '',
    role: ['all'],
    permissions: isAuth,
  },
  UpdateApp: {
    name: 'UpdateApp',
    slug: 'UpdateApp',
    desc: '',
    role: ['all'],
    permissions: isAppOwner,
  },
  updateAppAssets: {
    name: 'updateAppAssets',
    slug: 'updateAppAssets',
    desc: '',
    role: ['all'],
    permissions: isAppOwner,
  },
  deleteApp: {
    name: 'deleteApp',
    slug: 'deleteApp',
    desc: '',
    role: ['all'],
    permissions: isAppOwner,
  },
  addLink: {
    name: 'addLink',
    slug: 'addLink',
    desc: '',
    role: ['all'],
    permissions: isAuth,
  },
  updateLink: {
    name: 'updateLink',
    slug: 'updateLink',
    desc: '',
    role: ['all'],
    permissions: isAppOwnerFromLink,
  },
  deleteLink: {
    name: 'deleteLink',
    slug: 'deleteLink',
    desc: '',
    role: ['all'],
    permissions: isAppOwnerFromLink,
  },
}
const auth = {
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
export const mutationsShield = {
  ...auth,

  ...appMutationsShield,
}
