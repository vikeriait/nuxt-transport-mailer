# Configuration

You can configure the module in your `nuxt.config.ts` under the `transportMailer` key or using Environment Variables.

## Nuxt Config

```typescript
export default defineNuxtConfig({
  modules: ['@vikeriait/nuxt-transport-mailer'],

  transportMailer: {
    // Example configuration
    driver: 'smtp',
    smtp: {
      host: 'smtp.example.com',
      port: 587,
      auth: {
        user: 'user',
        pass: 'pass',
      },
    }
  },
})
```

### Options Reference

#### Main Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `driver` | `string` | `'smtp'` | The transport driver to use (`'smtp'` \| `'ses'`). |
| `edge` | `boolean` | `false` | Enable Edge compatibility mode (uses `aws4fetch` for SES). |
| `defaults` | `object` | `{ from: '' }` | Default options applied to every email. |

#### SMTP Options (`smtp`)

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `host` | `string` | `'localhost'` | SMTP server hostname. |
| `port` | `number` | `2525` | SMTP server port. |
| `secure` | `boolean` | `false` | If true, uses TLS. |
| `auth.user` | `string` | `undefined` | SMTP username. |
| `auth.pass` | `string` | `undefined` | SMTP password. |

::: tip
For a full list of SMTP options, please refer to the [Nodemailer SMTP documentation](https://nodemailer.com/smtp).
:::

#### AWS SES Options (`ses`)

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `clientConfig` | `object` | `{}` | AWS SES SDK Client configuration (region, credentials, etc.). |
| `commandInput` | `object` | `{}` | Default command input options. |
| `endpoint` | `string` | `undefined` | Custom endpoint for SES (optional). |

::: tip AWS Credentials
**Node.js (Standard)**: If you are using the default Node.js runtime, the official AWS SDK will automatically detect credentials from standard environment variables (e.g., `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`). You usually don't need to configure `clientConfig` explicitly.

**Edge (aws4fetch)**: When `edge: true`, the module uses `aws4fetch`, which **does not** automatically read standard AWS environment variables. You **must** explicitly provide credentials via `clientConfig` (in `nuxt.config.ts`) or by using the specific environment variables listed below (e.g., `NUXT_TRANSPORT_MAILER_SES_CLIENT_CONFIG_ACCESS_KEY_ID`).
:::

#### Server API (`serverApi`)

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `false` | Enables the `/api/mail/send` endpoint. |
| `route` | `string` | `'/api/mail/send'` | The path for the API endpoint. |

#### Security (`security`)

**Captcha (Custom)**

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `captcha.enabled` | `boolean` | `false` | Enables captcha verification. |
| `captcha.provider` | `'turnstile' \| 'recaptcha' \| 'hcaptcha'` | `undefined` | Captcha provider. |
| `captcha.secretKey` | `string` | `undefined` | Secret key for captcha provider. |

**Other Security Rules**

The `security` object integrates directly with **nuxt-security**. 

::: info
If `serverApi.enabled` is `true`, the following **Rate Limiter** defaults are automatically applied to the API route to prevent abuse:

```typescript
rateLimiter: {
  tokensPerInterval: 2,
  interval: 3000000, // 50 minutes
}
```
:::

You can override these defaults or add any other [nuxt-security](https://nuxt-security.vercel.app/documentation/getting-started/configuration) route rules (CORS, headers, etc.).

```typescript
security: {
  rateLimiter: {
    tokensPerInterval: 5,
    interval: 300000,
  },
  corsHandler: {
    origin: '*',
    methods: ['POST']
  }
}
```

::: warning Note
These settings rely on the **nuxt-security** module. 
1. You must have `nuxt-security` installed for these rules (Rate Limiter, CORS, etc.) to take effect.
2. **Scoped Rules**: Any rule defined under `security` (except `captcha`) is applied **only to the mailer API route** (e.g., `/api/mail/send`). It will not affect the rest of your application.
3. **Inheritance**: The mailer route will also inherit any **global** security rules defined by `nuxt-security` (e.g., global Security Headers), unless you explicitly override or disable them within the `security` object here.
:::

## Environment Variables

The recommended way to handle sensitive credentials is using a `.env` file.

```bash
# Driver
NUXT_TRANSPORT_MAILER_DRIVER=smtp

# Edge Mode
NUXT_TRANSPORT_MAILER_EDGE=true

# SMTP
NUXT_TRANSPORT_MAILER_SMTP_HOST=smtp.example.com
NUXT_TRANSPORT_MAILER_SMTP_PORT=587
NUXT_TRANSPORT_MAILER_SMTP_AUTH_USER=myuser
NUXT_TRANSPORT_MAILER_SMTP_AUTH_PASS=mypassword
NUXT_TRANSPORT_MAILER_SMTP_SECURE=false

# Defaults
NUXT_TRANSPORT_MAILER_DEFAULTS_FROM="My App <noreply@example.com>"

# AWS SES (Node.js - Auto-detected)
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# AWS SES (Edge - Explicit mapping required)
NUXT_TRANSPORT_MAILER_SES_CLIENT_CONFIG_REGION=...
NUXT_TRANSPORT_MAILER_SES_CLIENT_CONFIG_ACCESS_KEY_ID=...
NUXT_TRANSPORT_MAILER_SES_CLIENT_CONFIG_SECRET_ACCESS_KEY=...
# Optional custom endpoint
NUXT_TRANSPORT_MAILER_SES_ENDPOINT=...

# Security - Captcha
NUXT_TRANSPORT_MAILER_SECURITY_CAPTCHA_ENABLED=true
NUXT_TRANSPORT_MAILER_SECURITY_CAPTCHA_PROVIDER=turnstile
NUXT_TRANSPORT_MAILER_SECURITY_CAPTCHA_SECRET_KEY=...
```
