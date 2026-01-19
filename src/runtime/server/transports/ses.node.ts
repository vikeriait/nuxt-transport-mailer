import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2'
import * as nodemailer from 'nodemailer'
import type { EmailOptions, ModuleOptions } from '../../../types'
import { getSesClientConfigNode, toNodemailerMailOptions } from '../utils/compatibility'

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
export const sendSesNode = async (sesConfig: ModuleOptions['ses'], options: EmailOptions) => {
  const clientConfig = getSesClientConfigNode(sesConfig)

  const sesClient = new SESv2Client(clientConfig)

  const normalizedOptions = toNodemailerMailOptions(options, sesConfig)

  const transporter = nodemailer.createTransport({
    SES: { sesClient, SendEmailCommand },
  })

  return await transporter.sendMail(normalizedOptions)
}
