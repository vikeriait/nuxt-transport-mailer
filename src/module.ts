import { defineNuxtModule, createResolver, addServerImportsDir, addServerHandler } from '@nuxt/kit'
import { defu } from 'defu'
import type { ModuleOptions } from './types'

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
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.transportMailer = defu(nuxt.options.runtimeConfig.transportMailer, options)

    if (options.serverApi?.enabled) {
      addServerHandler({
        route: options.serverApi.route || '/api/mail/send',
        handler: resolver.resolve('./runtime/server/api/send.post'),
      })
    }

    addServerImportsDir(resolver.resolve('./runtime/server/utils'))
  },
})
