import { defu } from 'defu'
import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import type { ModuleOptions } from '../../../types'
import type { NuxtSecurityRouteRules } from 'nuxt-security'

/**
 * Nitro plugin to register Nuxt Security route rules for the mailer API endpoint.
 * This ensures that rate limiting and other security headers are applied if configured.
 */
export default defineNitroPlugin(async (nitroApp) => {
  nitroApp.hooks.hook('nuxt-security:routeRules', (appSecurityOptions: Record<string, Partial<NuxtSecurityRouteRules>>) => {
    const transportMailerConfig = useRuntimeConfig().transportMailer as ModuleOptions

    if (!transportMailerConfig?.security)
      return

    const apiRoute = transportMailerConfig.serverApi?.route || '/api/mail/send'

    const { captcha, ...validNuxtSecurityOptions } = transportMailerConfig.security

    appSecurityOptions[apiRoute] = defu(
      appSecurityOptions[apiRoute],
      validNuxtSecurityOptions,
    )
  })
})
