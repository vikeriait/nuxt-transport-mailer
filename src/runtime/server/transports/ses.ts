import type { SentMessageInfo } from 'nodemailer'
import type { ModuleOptions } from '../../../types'
import type SESTransport from 'nodemailer/lib/ses-transport'
import { sendSesNode } from '../../../runtime/server/transports/ses.node'
import { useRuntimeConfig } from 'nitropack/runtime'
import { sendSesEdge } from '../../../runtime/server/transports/ses.edge'

/**
 * Sends an email using the SES transport.
 *
 * @param sesConfig - The SES configuration options.
 * @param options - The email options (to, subject, body, etc.).
 * @returns A promise that resolves to the sent message info.
 * @throws Will throw an error if the SES transport fails or if nodemailer cannot be imported.
 */
export const sendSes = async (sesConfig: ModuleOptions['ses'], options: SESTransport.MailOptions): Promise<SentMessageInfo> => {
  try {
    if (useRuntimeConfig().transportMailer.edge) {
      return await sendSesEdge(sesConfig, options)
    }
    else {
      return await sendSesNode(sesConfig, options)
    }
  }
  catch (error: unknown) {
    throw new Error(`[nuxt-transport-mailer] SES Transport failed: ${error.message || error}`)
  }
}
