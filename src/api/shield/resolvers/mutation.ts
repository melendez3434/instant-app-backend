import { allow } from 'graphql-shield'
import { isAppOwner, isAppOwnerFromLink, isAuth } from '../rules'

const appMutationsShield = {
  subscribe: {
    name: 'subscribe',
    slug: 'subscribe',
    desc: '',
    role: ['all'],
    permissions: isAuth,
  },
  // editMyPlan: {
  //   name: 'editMyPlan',
  //   slug: 'editMyPlan',
  //   desc: '',
  //   role: ['all'],
  //   permissions: isAuth,
  // },
  updateDeployRequest: {
    name: 'updateDeployRequest',
    slug: 'updateDeployRequest',
    desc: '',
    role: ['superAdmin'],
    permissions: isAuth,
  },
  generateBuild: {
    name: 'generateBuild',
    slug: 'generateBuild',
    desc: '',
    role: ['superAdmin'],
    permissions: isAuth,
  },
  addApp: {
    name: 'addApp',
    slug: 'addApp',
    desc: '',
    role: ['all'],
    permissions: isAuth,
  },
  updateApp: {
    name: 'updateApp',
    slug: 'updateApp',
    desc: '',
    role: ['all'],
    permissions: isAppOwner,
  },
  addDeployRequest: {
    name: 'addDeployRequest',
    slug: 'addDeployRequest',
    desc: '',
    role: ['all'],
    permissions: isAppOwner,
  },
  updateIosProfile: {
    name: 'updateIosProfile',
    slug: 'updateIosProfile',
    desc: '',
    role: ['all'],
    permissions: isAppOwner,
  },
  updateAndroidProfile: {
    name: 'updateAndroidProfile',
    slug: 'updateAndroidProfile',
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
  updateAppDesign: {
    name: 'updateAppDesign',
    slug: 'updateAppDesign',
    desc: '',
    role: ['all'],
    permissions: isAppOwner,
  },
  updateAppDesignDrawer: {
    name: 'updateAppDesignDrawer',
    slug: 'updateAppDesignDrawer',
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
  signupSuperAdmin: {
    name: 'signupSuperAdmin',
    slug: 'signupSuperAdmin',
    desc: '',
    role: ['all'],
    permissions: allow,
  },
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
