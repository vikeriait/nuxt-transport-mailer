import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  transportMailer: {
    serverApi: {
      enabled: true,
    },
    defaults: {
      from: 'test@example.com',
    },
    smtp: {
      host: 'localhost',
      port: 1025,
    },
  },
})
