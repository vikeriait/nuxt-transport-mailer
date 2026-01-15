export default defineNuxtConfig({
  modules: ['../src/module', 'nuxt-security'],
  devtools: { enabled: true },
  compatibilityDate: '2025-01-12',
  transportMailer: {
    serverApi: {
      enabled: true,
    },
    smtp: {
      auth: {
        user: '',
        pass: '',
      },
    },
  },
})
