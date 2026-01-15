# Nuxt Transport Mailer

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A robust and flexible Nuxt module for sending emails using [Nodemailer](https://nodemailer.com/). It offers a ready-to-use server API endpoint, TypeScript support, Zod validation, and built-in security features like Captcha and Rate Limiting.

## Features

- 📧 **Transport Support**: Easily configure SMTP transports (via Nodemailer).
- 🚀 **Server-Side API**: Optional built-in API endpoint (`/api/mail/send`) to send emails from your frontend.
- 🛡️ **Security First**: 
  - Integrated **Captcha** support (Cloudflare Turnstile, Google reCAPTCHA, hCaptcha).
  - **Rate Limiting** support (via `nuxt-security` integration).
  - **Honeypot** field protection.
- ✅ **Validation**: Strict email body validation using **Zod**.
- 🛠️ **Composable**: `useMailer()` composable for easy client-side integration.
- ⚙️ **Type Safe**: Full TypeScript support with auto-completion.

## Quick Setup

1. Add `@vikeriait/nuxt-transport-mailer` dependency to your project:

```bash
# Using pnpm
pnpm add @vikeriait/nuxt-transport-mailer

# Using npm
npm install @vikeriait/nuxt-transport-mailer

# Using yarn
yarn add @vikeriait/nuxt-transport-mailer
```

2. Add `@vikeriait/nuxt-transport-mailer` to the `modules` section of `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: [
    '@vikeriait/nuxt-transport-mailer'
  ],
  
  transportMailer: {
    // Module configuration
  }
})
```

## Configuration

Configure the module in your `nuxt.config.ts` under the `transportMailer` key.

```typescript
export default defineNuxtConfig({
  modules: ['@vikeriait/nuxt-transport-mailer'],

  transportMailer: {
    // Select the driver (currently 'smtp' is supported)
    driver: 'smtp',

    // SMTP Configuration (Standard Nodemailer options)
    smtp: {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: '',
        pass: '',
      },
    },

    // Default options for all emails
    defaults: {
      from: '"My Application" <noreply@example.com>',
    },

    // Server API Endpoint Configuration
    serverApi: {
      enabled: true, // Enable the /api/mail/send endpoint
      route: '/api/mail/send', // Customize the route path
    },

    // Security Configuration
    security: {
      // Captcha Configuration (Custom module feature)
      captcha: {
        enabled: true,
        provider: 'turnstile', // 'turnstile' | 'recaptcha' | 'hcaptcha'
        secretKey: '',
      },
      // Nuxt Security Route Rules (Integrates with nuxt-security)
      // You can add any valid nuxt-security route rule here (CORS, Rate Limiting, etc.)
      rateLimiter: {
        tokensPerInterval: 5,
        interval: 300000, // 5 minutes
      },
      corsHandler: {
        origin: '*',
        methods: ['POST']
      }
    },
  },
})
```

### Environment Variables

You can also configure the module using environment variables. This is the recommended way to handle sensitive information like SMTP credentials or secret keys.

```bash
NUXT_TRANSPORT_MAILER_DRIVER=smtp

NUXT_TRANSPORT_MAILER_SMTP_HOST=smtp.example.com
NUXT_TRANSPORT_MAILER_SMTP_PORT=587
NUXT_TRANSPORT_MAILER_SMTP_AUTH_USER=myuser
NUXT_TRANSPORT_MAILER_SMTP_AUTH_PASS=mypassword
NUXT_TRANSPORT_MAILER_SMTP_SECURE=false

NUXT_TRANSPORT_MAILER_SECURITY_CAPTCHA_ENABLED=true
NUXT_TRANSPORT_MAILER_SECURITY_CAPTCHA_PROVIDER=turnstile
NUXT_TRANSPORT_MAILER_SECURITY_CAPTCHA_SECRET_KEY=XXXXXXXXXXXXXXXXXXXXXXXXX

NUXT_TRANSPORT_MAILER_DEFAULTS_FROM='"My Application" <noreply@example.com>'
```

## Usage

### Client-Side (Using `useMailer`)

The module provides a `useMailer` composable to send emails easily from your Vue components.

```vue
<script setup lang="ts">
const { send, pending, error, data } = useMailer()
const turnstileToken = ref('')

async function submitForm() {
  await send({
    to: 'contact@example.com',
    subject: 'New Inquiry',
    text: 'Hello, I would like to know more about your services.',
    html: '<p>Hello, I would like to know more about your services.</p>',
    // If captcha is enabled, pass the token
    captchaToken: turnstileToken.value
  })

  if (!error.value) {
    alert('Email sent successfully!')
  }
}
</script>
```

### Server-Side

You can send emails directly from your server-side API handlers or middleware using `sendMail`.

```typescript
// server/api/custom-email.post.ts
import { sendMail } from '#imports'

export default defineEventHandler(async (event) => {
  try {
    const result = await sendMail({
      to: 'user@example.com',
      subject: 'Welcome!',
      text: 'Thank you for signing up.',
    })
    
    return { success: true, result }
  } catch (error) {
    // Handle error
    throw createError({ statusCode: 500, message: 'Failed to send email' })
  }
})
```

## Security & Validation

> [!IMPORTANT]
> To use the integrated security features (Rate Limiting, CORS, etc.), you must have [**nuxt-security**](https://nuxt-security.vercel.app/) installed and enabled in your project.

### Captcha
To enable Captcha, configure the `security.captcha` options. When enabled, you must include a `captchaToken` field in the request body containing the token received from your captcha provider. The module validates this token server-side before processing the email. You must provide a valid `secretKey` for your chosen provider.

### Honeypot
The built-in API endpoint includes a honeypot protection. You can add a hidden field named `_gotcha` to your form. If this field is filled (which bots usually do), the request will be accepted but the email will not be sent, silently preventing spam.

### Rate Limiting
This module integrates with `nuxt-security` (if installed) to apply rate limiting to the mailer endpoint. You can configure `tokensPerInterval` and `interval` in the config.

### Validation
The email body is validated using **Zod**. The following fields are supported:
- `to`, `cc`, `bcc` (at least one is required)
- `subject`
- `text`, `html`
- `from`, `replyTo`
- `_gotcha` (honeypot field)
- `captchaToken` (required if captcha is enabled)

## Development

```bash
# Install dependencies
pnpm install

# Prepare
pnpm dev:prepare

# Run playground
pnpm dev

# Run tests
pnpm test
```

## License

[MIT License](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@vikeriait/nuxt-transport-mailer/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@vikeriait/nuxt-transport-mailer

[npm-downloads-src]: https://img.shields.io/npm/dm/@vikeriait/nuxt-transport-mailer.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@vikeriait/nuxt-transport-mailer

[license-src]: https://img.shields.io/npm/l/@vikeriait/nuxt-transport-mailer.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@vikeriait/nuxt-transport-mailer

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
