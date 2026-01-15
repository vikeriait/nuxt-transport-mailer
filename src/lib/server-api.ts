import type { Nuxt } from '@nuxt/schema'
import { addServerHandler } from '@nuxt/kit'
import type { Resolver } from '@nuxt/kit'
import type { ModuleOptions } from '../types'

/**
 * Sets up the server-side API handler for sending emails if enabled in the options.
 *
 * @param options - The module options.
 * @param nuxt - The Nuxt instance.
 * @param resolver - The path resolver.
 */
export function setupServerApi(options: ModuleOptions, nuxt: Nuxt, resolver: Resolver) {
  if (!options.serverApi?.enabled)
    return

  const apiRoute = options.serverApi.route || '/api/mail/send'

  addServerHandler({
    route: apiRoute,
    handler: resolver.resolve('./runtime/server/api/send.post'),
  })
}
