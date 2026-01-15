import {
  defineNuxtModule,
  createResolver,
  addServerImportsDir,
  addServerPlugin,
} from '@nuxt/kit'
import { defu } from 'defu'
import type { ModuleOptions } from './types'
import { setupServerApi } from './lib/server-api'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-transport-mailer',
    configKey: 'transportMailer',
  },
  defaults: {
    driver: 'smtp',
    smtp: {
      host: 'localhost',
      port: 2525,
      secure: false,
    },
    defaults: {
      from: '',
    },
    serverApi: {
      enabled: false,
      route: '/api/mail/send',
    },
    security: {
      captcha: {
        enabled: false,
        provider: undefined,
        secretKey: undefined,
      },
      rateLimiter: {
        tokensPerInterval: 2,
        interval: 3000000,
      },
    },
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.transportMailer = defu(nuxt.options.runtimeConfig.transportMailer, options)

    setupServerApi(options, nuxt, resolver)

    addServerImportsDir(resolver.resolve('./runtime/server/utils'))
    addServerPlugin(resolver.resolve('./runtime/server/plugins/routeRules'))
  },
})
