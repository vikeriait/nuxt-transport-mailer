import type { SentMessageInfo } from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import type { ModuleOptions } from '../../../types'
import type { SMTPError } from 'nodemailer/lib/smtp-connection'

/**
 * Sends an email using the SMTP transport.
 *
 * @param config - The module configuration containing SMTP settings.
 * @param options - The email options (to, subject, body, etc.).
 * @returns A promise that resolves to the sent message info.
 * @throws Will throw an error if the SMTP transport fails or if nodemailer cannot be imported.
 */
export const sendSmtp = async (config: ModuleOptions, options: Mail.Options): Promise<SentMessageInfo> => {
  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport(config.smtp)
    return await transporter.sendMail(options)
  }
  catch (error: unknown) {
    const err = error as SMTPError
    throw new Error(`[nuxt-transport-mailer] SMTP Transport failed: ${err}.`)
  }
}
