import type { SentMessageInfo } from 'nodemailer'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import * as nodemailer from 'nodemailer'
import type { ModuleOptions } from '../../../types'
import { defu } from 'defu'
import type SESTransport from 'nodemailer/lib/ses-transport'

/**
 * Sends an email using the SES transport.
 *
 * @param sesConfig - The SES configuration options.
 * @param options - The email options (to, subject, body, etc.).
 * @returns A promise that resolves to the sent message info.
 * @throws Will throw an error if the SES transport fails or if nodemailer cannot be imported.
 */
export const sendSes = async (sesConfig: ModuleOptions['ses'], options: SESTransport.MailOptions): Promise<SentMessageInfo> => {
  const sesClient = new SESv2Client(sesConfig?.clientConfig ?? {})

  options.ses = defu(
    options.ses,
    sesConfig?.commandInput ?? {},
  )

  try {
    const transporter = nodemailer.createTransport({
      SES: { sesClient, SendEmailCommand },
    })
    return await transporter.sendMail(options)
  }
  catch (error: unknown) {
    console.error(error)
    throw new Error(`[nuxt-transport-mailer] SES Transport failed: ${error}.`)
  }
}
