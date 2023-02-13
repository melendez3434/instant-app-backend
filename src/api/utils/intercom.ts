import { Client } from 'intercom-client'
export const intercomClient = new Client({
  tokenAuth: { token: process.env.INTERCOM_AUTH_TOKEN! },
})
