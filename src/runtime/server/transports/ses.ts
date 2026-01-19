import type { SentMessageInfo } from 'nodemailer'
import type { EmailOptions, ModuleOptions } from '../../../types'
import { useRuntimeConfig } from 'nitropack/runtime'

/**
 * Sends an email using the SES transport.
 *
 * @param sesConfig - The SES configuration options.
 * @param options - The email options (to, subject, body, etc.).
 * @returns A promise that resolves to the sent message info.
 * @throws Will throw an error if the SES transport fails or if nodemailer cannot be imported.
 */
export const sendSes = async (sesConfig: ModuleOptions['ses'], options: EmailOptions): Promise<SentMessageInfo> => {
  try {
    if (useRuntimeConfig().transportMailer.edge) {
      const { sendSesEdge } = await import('./ses.edge')
      return await sendSesEdge(sesConfig, options)
    }
    else {
      const { sendSesNode } = await import('./ses.node')
      return await sendSesNode(sesConfig, options)
    }
  }
  catch (error: unknown) {
    const err = error as Error
    throw new Error(`[nuxt-transport-mailer] SES Transport failed: ${err.message || err}`)
  }
}
