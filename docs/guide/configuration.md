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
| `driver` | `string` | `'smtp'` | The transport driver to use. |
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

# SMTP
NUXT_TRANSPORT_MAILER_SMTP_HOST=smtp.example.com
NUXT_TRANSPORT_MAILER_SMTP_PORT=587
NUXT_TRANSPORT_MAILER_SMTP_AUTH_USER=myuser
NUXT_TRANSPORT_MAILER_SMTP_AUTH_PASS=mypassword
NUXT_TRANSPORT_MAILER_SMTP_SECURE=false

# Defaults
NUXT_TRANSPORT_MAILER_DEFAULTS_FROM="My App <noreply@example.com>"

# Security - Captcha
NUXT_TRANSPORT_MAILER_SECURITY_CAPTCHA_ENABLED=true
NUXT_TRANSPORT_MAILER_SECURITY_CAPTCHA_PROVIDER=turnstile
NUXT_TRANSPORT_MAILER_SECURITY_CAPTCHA_SECRET_KEY=...
```
