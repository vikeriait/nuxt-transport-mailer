import type { SentMessageInfo } from 'nodemailer'
import type { EmailOptions } from '../../../types'
import type { SMTPError } from 'nodemailer/lib/smtp-connection'
import { isEdgeEnvironment, toNodemailerMailOptions } from '../utils/compatibility'
import * as nodemailer from 'nodemailer'

/**
 * Sends an email using the Stream transport.
 *
 * @param options - The email options (to, subject, body, etc.).
 * @returns A promise that resolves to the sent message info.
 * @throws Will throw an error if the SMTP transport fails or if nodemailer cannot be imported.
 */
export const sendStream = async (options: EmailOptions): Promise<SentMessageInfo> => {
  if (isEdgeEnvironment()) {
    throw new Error(`[nuxt-transport-mailer] Stream Transport can't be used in edge environments`)
  }

  try {
    const nodeOptions = toNodemailerMailOptions(options)

    const transporter = nodemailer.createTransport({
      streamTransport: true,
    })
    return await transporter.sendMail(nodeOptions)
  }
  catch (error: unknown) {
    const err = error as SMTPError
    throw new Error(`[nuxt-transport-mailer] Stream Transport failed: ${err.message || err}`)
  }
}
