import { useRuntimeConfig } from '#imports'
import type { SendMailOptions, SentMessageInfo } from 'nodemailer'
import { defu } from 'defu'
import type { ModuleOptions } from '../../../types'
import type Mail from 'nodemailer/lib/mailer'
import { sendSmtp } from '../transports/smtp'

/**
 * Sends an email using the configured transport driver.
 *
 * This function is designed to be used in server-side code (API handlers, server middleware).
 * It automatically merges the provided options with the module's default configuration.
 *
 * @param options - The email options (to, from, subject, text, html, etc.).
 * @returns A promise that resolves to the sent message info.
 * @throws Will throw an error if the 'from' address or recipients are missing, or if the transport fails.
 */
export const sendMail = async (options: SendMailOptions): Promise<SentMessageInfo> => {
  const config = useRuntimeConfig().transportMailer as ModuleOptions
  const driver = config.driver
  const defaultOptions = config.defaults || {}

  const finalOptions = defu(options, defaultOptions) as Mail.Options

  // Validation: Ensure essential fields are present
  if (!finalOptions.from) {
    throw new Error('[nuxt-transport-mailer] Missing "from" address. Please define it in the send options or in the module defaults.')
  }

  if (!finalOptions.to && !finalOptions.cc && !finalOptions.bcc) {
    throw new Error('[nuxt-transport-mailer] Missing recipient. Please provide at least one of "to", "cc", or "bcc".')
  }

  if (driver === 'smtp') {
    return await sendSmtp(config, finalOptions)
  }

  throw new Error(`[nuxt-transport-mailer] Driver '${driver}' not implemented or supported.`)
}
