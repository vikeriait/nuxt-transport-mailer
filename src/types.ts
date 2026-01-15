import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import type { NuxtSecurityRouteRules } from 'nuxt-security'

export interface ModuleOptions {
  /**
   * The driver to use for sending emails.
   * Currently supported: 'smtp'.
   * @default 'smtp'
   */
  driver: 'smtp'

  /**
   * SMTP transport configuration options.
   * Check Nodemailer documentation for detailed options.
   */
  smtp?: SMTPTransport.Options & { streamTransport?: boolean }

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
