import {
  defineNuxtModule,
  createResolver,
  addServerImportsDir,
  addImportsDir,
  addServerPlugin,
} from '@nuxt/kit'
import { defu } from 'defu'
import type { ModuleOptions } from './types'
import { setupServerApi } from './lib/server-api'

/**
 * Nuxt module for sending emails via various transports (SMTP, etc.) with support for server-side API,
 * captcha protection, and rate limiting.
 */
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-transport-mailer',
    configKey: 'transportMailer',
  },
  defaults: {
    edge: undefined,
    driver: 'smtp',
    smtp: {
      host: 'localhost',
      port: 2525,
      secure: false,
      auth: {
        user: undefined,
        pass: undefined,
      },
    },
    ses: {
      clientConfig: {
        region: undefined,
        accessKeyId: undefined,
        secretAccessKey: undefined,
      },
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

    nuxt.options.runtimeConfig.public.transportMailer = defu(
      nuxt.options.runtimeConfig.public.transportMailer || {},
      {
        serverApi: {
          route: options.serverApi?.route,
        },
      },
    )

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.commonJS = defu(nitroConfig.commonJS, {
        requireReturnsDefault: 'preferred',
      })
    })

    setupServerApi(nuxt.options.runtimeConfig.transportMailer as ModuleOptions, nuxt, resolver)

    addServerImportsDir(resolver.resolve('./runtime/server/utils'))
    addImportsDir(resolver.resolve('./runtime/composables'))
    addServerPlugin(resolver.resolve('./runtime/server/plugins/routeRules'))
  },
})
