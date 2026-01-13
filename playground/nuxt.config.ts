export default defineNuxtConfig({
  modules: ['../src/module'],
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
