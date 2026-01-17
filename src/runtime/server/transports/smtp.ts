import type { SentMessageInfo } from 'nodemailer'
import type { ModuleOptions } from '../../../types'
import type { SMTPError } from 'nodemailer/lib/smtp-connection'
import * as nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

/**
 * Sends an email using the SMTP transport.
 *
 * @param smtpConfig - the SMTP configuration for Nodemailer
 * @param options - The email options (to, subject, body, etc.).
 * @returns A promise that resolves to the sent message info.
 * @throws Will throw an error if the SMTP transport fails or if nodemailer cannot be imported.
 */
export const sendSmtp = async (smtpConfig: ModuleOptions['smtp'], options: SMTPTransport.MailOptions): Promise<SentMessageInfo> => {
  try {
    const transporter = nodemailer.createTransport(smtpConfig)
    return await transporter.sendMail(options)
  }
  catch (error: unknown) {
    const err = error as SMTPError
    throw new Error(`[nuxt-transport-mailer] SMTP Transport failed: ${err.message || err}`)
  }
}
