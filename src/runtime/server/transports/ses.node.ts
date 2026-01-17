import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2'
import type { SESv2ClientConfig } from '@aws-sdk/client-sesv2'
import { defu } from 'defu'
import * as nodemailer from 'nodemailer'
import type { ModuleOptions } from '../../../types'
import type SESTransport from 'nodemailer/lib/ses-transport'

/**
 * Sends an email using Amazon SES via the official AWS SDK v3 and Nodemailer.
 *
 * This function is optimized for Node.js environments and leverages `nodemailer`'s
 * built-in transport mechanism for seamless integration.
 *
 * @param sesConfig - The SES configuration options.
 * @param options - The email options.
 * @returns A promise that resolves to the sent message info.
 */
export const sendSesNode = async (sesConfig: ModuleOptions['ses'], options: SESTransport.MailOptions) => {
  let clientConfig = sesConfig?.clientConfig || {}

  // @ts-expect-error - Handling potential flat config from ModuleOptions
  if (clientConfig.accessKeyId && clientConfig.secretAccessKey && !clientConfig.credentials) {
    clientConfig = {
      ...clientConfig,
      credentials: {
        // @ts-expect-error - Handling potential flat config from ModuleOptions
        accessKeyId: clientConfig.accessKeyId,
        // @ts-expect-error - Handling potential flat config from ModuleOptions
        secretAccessKey: clientConfig.secretAccessKey,
        // @ts-expect-error - Handling potential flat config from ModuleOptions
        sessionToken: clientConfig.sessionToken,
      },
    }
  }

  const sesClient = new SESv2Client(clientConfig as SESv2ClientConfig)

  options.ses = defu(
    options.ses,
    sesConfig?.commandInput ?? {},
  )

  const transporter = nodemailer.createTransport({
    SES: { sesClient, SendEmailCommand },
  })

  return await transporter.sendMail(options)
}
