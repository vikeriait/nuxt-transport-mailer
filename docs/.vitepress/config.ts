import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'

export default defineConfig({
  title: 'Nuxt Transport Mailer',
  description: 'A robust and flexible Nuxt module for sending emails using Nodemailer.',

  head: [['link', { rel: 'icon', href: '/logo.svg' }]],

  markdown: {
    config(md) {
      md.use(groupIconMdPlugin)
    },
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Usage', link: '/guide/usage' },
          { text: 'Security', link: '/guide/security' },
        ],
      },
      {
        text: 'API',
        items: [
          { text: 'Reference', link: '/api/' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vikeriait/nuxt-transport-mailer' },
    ],
  },

  vite: {
    plugins: [groupIconVitePlugin()],
  },

  sitemap: {
    hostname: 'https://nuxt-transport-mailer.vikeria.it',
  },
})
