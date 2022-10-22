import { allow } from 'graphql-shield'
import { isAuth } from '../rules'

export const queriesShield = {
  me: {
    name: 'me',
    slug: 'me',
    desc: '',
    role: ['all'],
    permissions: allow,
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
