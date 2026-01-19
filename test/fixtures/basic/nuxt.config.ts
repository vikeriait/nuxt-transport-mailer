import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
    'nuxt-security',
  ],
  // @ts-expect-error: This is a known issue with type-checking test fixtures
  security: {
    enabled: true,
  },
  transportMailer: {
    driver: 'stream',
    serverApi: {
      enabled: true,
    },
    defaults: {
      from: 'test@example.com',
    },
    security: {
      corsHandler: {
        origin: ['https://example.com'],
        methods: ['POST', 'OPTIONS'],
      },
    },
  },
})
