import type { SentMessageInfo } from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import type { ModuleOptions } from '../../../types'
import type { SMTPError } from 'nodemailer/lib/smtp-connection'

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
