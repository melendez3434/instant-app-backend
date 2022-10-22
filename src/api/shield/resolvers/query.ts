import { allow } from 'graphql-shield'
import { isAppOwner, isAuth } from '../rules'

export const queriesShield = {
  me: {
    name: 'me',
    slug: 'me',
    desc: '',
    role: ['all'],
    permissions: allow,
  },
  app: {
    name: 'app',
    slug: 'app',
    desc: '',
    role: ['all'],
    permissions: isAppOwner,
  },
  apps: {
    name: 'apps',
    slug: 'apps',
    desc: '',
    role: ['all'],
    permissions: isAuth,
  },
  links: {
    name: 'links',
    slug: 'links',
    desc: '',
    role: ['all'],
    permissions: isAuth,
  },
}
