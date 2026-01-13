import type SMTPTransport from 'nodemailer/lib/smtp-transport'

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
  smtp?: SMTPTransport.Options

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
