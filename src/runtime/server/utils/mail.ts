import { useRuntimeConfig } from 'nitropack/runtime'
import type { SendMailOptions, SentMessageInfo } from 'nodemailer'
import { defu } from 'defu'
import type { ModuleOptions } from '../../../types'
import type Mail from 'nodemailer/lib/mailer'
import { sendSmtp } from '../transports/smtp'
import { emailConfigurationSchema } from './schemas'

/**
 * Sends an email using the configured transport driver.
 *
 * This function is designed to be used in server-side code (API handlers, server middleware).
 * It automatically merges the provided options with the module's default configuration.
 *
 * @param options - The email options (to, from, subject, text, html, etc.).
 * @returns A promise that resolves to the sent message info.
 * @throws Will throw an error if validation fails (ZodError) or if the transport fails.
 */
export const sendMail = async (options: SendMailOptions): Promise<SentMessageInfo> => {
  const config = useRuntimeConfig().transportMailer as ModuleOptions
  const driver = config.driver
  const defaultOptions = config.defaults || {}

  const finalOptions = defu(options, defaultOptions) as Mail.Options

  const validatedOptions = emailConfigurationSchema.parse(finalOptions)

  if (driver === 'smtp') {
    return await sendSmtp(config.smtp, validatedOptions as Mail.Options)
  }

  throw new Error(`[nuxt-transport-mailer] Driver '${driver}' not implemented or supported.`)
}
