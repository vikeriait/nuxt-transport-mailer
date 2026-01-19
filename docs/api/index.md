# API Reference

## Composables

### `useMailer`

The main composable to send emails from the client-side.

```typescript
function useMailer(): {
  send: (mail: EmailBody) => Promise<void>
  data: Ref<SentMessageInfo | null>
  pending: Ref<boolean>
  error: Ref<FetchError | null>
}
```

#### Returns

- **`send`**: Function to trigger the email sending process.
- **`data`**: A generic ref containing the response from the server (e.g., sent message info).
- **`pending`**: A boolean ref indicating if the request is in progress.
- **`error`**: A ref containing any error that occurred during the request.

---

## Server Utils

### `sendMail`

Utility to send emails from server-side handlers (Nitro API routes, middleware).

```typescript
function sendMail(options: SendMailOptions): Promise<SentMessageInfo>
```

#### Parameters

- **`options`**: `SendMailOptions` (compatible with Nodemailer options).

#### Returns

- A Promise resolving to `SentMessageInfo` (Nodemailer response).

---

## Types

### `ModuleOptions`

Configuration options for the Nuxt module.

```typescript
interface ModuleOptions {
  /**
   * Manually force the module to run in "edge" mode.
   * If true, uses worker-mailer for SMTP and aws4fetch for SES.
   */
  edge?: boolean

  /**
   * The driver to use for sending emails.
   * Currently supported: 'smtp' | 'ses' | 'stream'.
   * @default 'smtp'
   */
  driver: 'smtp' | 'ses' | 'stream'

  /**
   * SMTP transport configuration options.
   * On Edge (Cloudflare), these are mapped to worker-mailer options.
   */
  smtp?: SMTPOptions

  /**
   * SES transport configuration options.
   */
  ses?: {
    endpoint?: string
    /**
     * AWS Client Config.
     * Node.js: SESv2ClientConfig
     * Edge: ConstructorParameters<typeof AwsClient>[0]
     */
    clientConfig?: SESv2ClientConfig | ConstructorParameters<typeof AwsClient>[0]
    commandInput?: Partial<SendEmailCommandInput>
  }

  /**
   * Default email options applied to every email sent.
   */
  defaults?: {
    from?: string
  }

  /**
   * Configuration for the server-side API endpoint.
   */
  serverApi?: {
    enabled?: boolean
    route?: string
  }

  /**
   * Security settings for the public API endpoint.
   */
  security?: Partial<NuxtSecurityRouteRules> & {
    captcha?: {
      /**
       * Enable captcha verification.
       * @default false
       */
      enabled?: boolean

      /**
       * Captcha provider.
       */
      provider?: 'turnstile' | 'recaptcha' | 'hcaptcha'

      /**
       * Secret key for the captcha provider.
       */
      secretKey?: string
    }
  }
}
```

### `EmailBody`

Zod inferred type for the email request body.

```typescript
interface EmailBody {
  to?: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject?: string
  text?: string
  html?: string
  from?: string
  replyTo?: string
  _gotcha?: string
  captchaToken?: string
}
```

### `TransportMailerError`

Standardized error structure returned by the module's API.

```typescript
interface TransportMailerError {
  statusCode: number
  statusMessage?: string
  message?: string
  data?: unknown
}
```

### `CaptchaVerification`

Type for captcha verification data.

```typescript
interface CaptchaVerification {
  token: string
  provider: 'turnstile' | 'recaptcha' | 'hcaptcha'
  secretKey: string
}
```
