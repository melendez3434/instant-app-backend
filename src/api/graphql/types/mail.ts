import axios from 'axios'
import { arg, extendType, inputObjectType, intArg, objectType } from 'nexus'

export const MailQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nullable.field('myMailLists', {
      type: 'JSONObject',
      async resolve(source, args, ctx) {
        const builder = await ctx.db.builder.findUnique({
          where: {
            domain: ctx.builderDomain,
          },
          select: { mailApiToken: true },
        })
        if (!builder?.mailApiToken) return null
        try {
          const { data } = await axios('https://mail.husl.app/api/v1/lists', {
            method: 'get',
            //   url: 'https://mail.husl.app/api/v1/lists',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              // Cookie:
              //   "XSRF-TOKEN=eyJpdiI6Im9sS3R5TGJHaXB4eVIzR3RzamVEOEE9PSIsInZhbHVlIjoiNnJEbmlGRUZJRTlmZUlGKzJMOUpSNjIwL3plRXFMR01sTG1JNmRWQTRxb1lDNUQyZ25xRnZ3MFI0RHdPZFg5UDJ6cm1PbTM1cThtTHZiUTh0NUptcXY5a0Z0UkI1aktsWmhtYzM0V0RSOGtEdy9oREpmSVY2ZVRudXowK3hLdWsiLCJtYWMiOiIxZTQ5ZTcyNGE0MzQwYjMzMWY3ZGJlYTg3Njk4N2Y5NTgwYzE3Zjk5Mjg0MmZiMDBmZDc1YWFiMDdjMjI4YzQ1IiwidGFnIjoiIn0%3D; acelle_mail_session=eyJpdiI6IllmT09HemtRVG5lemwwOHduR1ZYRXc9PSIsInZhbHVlIjoiNDVRdUJPL0FmNDk5bytLUTY5TnVGemFndHRHWXdoNzAvUWVoUTBLTHIzZUVFS1NET212QWJOM043aC9VbXEzZUF1WjZpY0RFS2dXclVaQzU2dVQ5MTV5TThXZTB2Qk1Nc0xPSnN1cHhNY2FlSTlVTmJDTC9Jc0t0ZGsyQkQ2aXYiLCJtYWMiOiI3NDQ4MjlkZjJlYWM0OTRjYTRiMGU0N2NhZmE3MGU4OGQzNzZlYzAwNDIyYWJhN2EyYjYyYzQzNmY4MDgwNGM0IiwidGFnIjoiIn0%3D",
            },
            data: JSON.stringify({
              api_token: builder?.mailApiToken,
            }),
          })
          console.log('🚀 ~ file: mail.ts ~ line 31 ~ resolve ~ data', data)
          return { data }
        } catch (error) {
          console.log('🚀 ~ file: mail.ts ~ line 35 ~ resolve ~ error', error)
          throw new Error(
            'wrong token, please make sure you copy it correctly ',
          )
        }
      },
    })
  },
})
