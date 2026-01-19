import type { SentMessageInfo } from 'nodemailer'
import type { EmailOptions, ModuleOptions } from '../../../types'
import type SMTPConnection from 'nodemailer/lib/smtp-connection'
import type { SMTPError } from 'nodemailer/lib/smtp-connection'
import type { WorkerMailerOptions } from 'worker-mailer'
import { isEdgeEnvironment } from '../utils/compatibility'

/**
 * Sends an email using the SMTP transport.
 *
 * @param smtpConfig - the SMTP configuration for Nodemailer
 * @param options - The email options (to, subject, body, etc.).
 * @returns A promise that resolves to the sent message info.
 * @throws Will throw an error if the SMTP transport fails or if nodemailer cannot be imported.
 */
export const sendSmtp = async (smtpConfig: ModuleOptions['smtp'], options: EmailOptions): Promise<SentMessageInfo> => {
  try {
    if (isEdgeEnvironment()) {
      const { sendSmtpEdge } = await import('./smtp.edge')
      return sendSmtpEdge(smtpConfig as WorkerMailerOptions, options)
    }
    else {
      const { sendSmtpNode } = await import('./smtp.node')
      return sendSmtpNode(smtpConfig as SMTPConnection.Options, options)
    }
  }
  catch (error: unknown) {
    const err = error as SMTPError
    throw new Error(`[nuxt-transport-mailer] SMTP Transport failed: ${err.message || err}`)
  }
}
