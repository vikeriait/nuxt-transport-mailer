import type { NuxtSecurityRouteRules } from 'nuxt-security'
import type SMTPConnection from 'nodemailer/lib/smtp-connection'
import type { SendEmailCommandInput, SendEmailRequest } from '@aws-sdk/client-sesv2'
import type { SESv2ClientConfig } from '@aws-sdk/client-sesv2/dist-types/SESv2Client'
import type { AwsClient } from 'aws4fetch'
import type { WorkerMailerOptions, EmailOptions as WorkerMailerEmailOptions } from 'worker-mailer'
import type SESTransport from 'nodemailer/lib/ses-transport'
import type { SentMessageInfo } from 'nodemailer'

export interface ModuleOptions {
  /**
   * Manually force the module to run in "edge" mode.
   *
   * If `true`, the module will use `worker-mailer` for SMTP and `aws4fetch` for SES,
   * regardless of the actual environment detection.
   * If `false`, it forces Node.js compatible drivers.
   * If `undefined`, the module attempts to auto-detect the environment (e.g., Cloudflare Workers).
   */
  edge?: boolean

  /**
   * The driver to use for sending emails.
   * Currently supported: 'smtp' | 'ses'.
   * @default 'smtp'
   */
  driver: 'smtp' | 'ses'

  /**
   * SMTP transport configuration options.
   * Check Nodemailer documentation for detailed options.
   *
   * For Edge environments (WorkerMailer), standard `auth` options are automatically mapped to `credentials`.
   * WARNING: SMTP on Edge is currently only supported on Cloudflare.
   */
  smtp?: SMTPOptions & { streamTransport?: boolean }

  /**
   * SES transport configuration options.
   * Check AWS SES documentation for detailed options.
   */
  ses?: {
    endpoint?: string
    /**
     * Configuration for the AWS client.
     *
     * Accepts:
     * - `SESv2ClientConfig` from `@aws-sdk/client-sesv2` for Node.js environments.
     * - `ConstructorParameters<typeof AwsClient>[0]` from `aws4fetch` for Edge environments.
     */
    clientConfig?: SESv2ClientConfig | ConstructorParameters<typeof AwsClient>[0]
    commandInput?: Partial<SendEmailCommandInput>
  }

  /**
   * Default email options applied to every email sent.
   */
  defaults?: {
    /**
     * Default sender address.
     * Example: '"My App" <noreply@example.com>'
     */
    from?: string
  }

  /**
   * Configuration for the server-side API endpoint.
   */
  serverApi?: {
    /**
     * Whether to enable the /api/mail/send endpoint.
     * WARNING: Enabling this without protection allows anyone to send emails via your server.
     * @default false
     */
    enabled?: boolean

    /**
     * The route path for the API endpoint.
     * @default '/api/mail/send'
     */
    route?: string
  }

  /**
   * Configuration options for the module's security features.
   * Extends NuxtSecurityRouteRules to allow configuring security headers and other options.
   */
  security?: Partial<NuxtSecurityRouteRules> & {
    /**
     * Captcha configuration.
     */
    captcha?: {
      /**
       * Enable captcha verification.
       * @default false
       */
      enabled?: boolean

      /**
       * Captcha provider.
       * Supported: 'turnstile', 'recaptcha', 'hcaptcha'.
       */
      provider?: 'turnstile' | 'recaptcha' | 'hcaptcha'

      /**
       * Secret key for the captcha provider.
       */
      secretKey?: string
    }
  }
}

/**
 * Standardized error structure returned by the module's API.
 * Corresponds to the H3Error shape in Nuxt.
 */
export interface TransportMailerError {
  statusCode: number
  statusMessage?: string
  message?: string
  data?: unknown
}

export type SMTPOptions = SMTPConnection.Options | WorkerMailerOptions
export type EmailOptions = SESTransport.MailOptions | WorkerMailerEmailOptions | SendEmailRequest

declare module 'nitropack' {
  export interface NitroRuntimeHooks {
    'transport:send:before': (options: EmailOptions) => void | Promise<void>
    'transport:send:after': (result: SentMessageInfo) => void | Promise<void>
  }
}
