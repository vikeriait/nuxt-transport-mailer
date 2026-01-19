import * as nodemailer from 'nodemailer'
import { toNodemailerConfig, toNodemailerMailOptions } from '../utils/compatibility'
import type { EmailOptions, SMTPOptions } from '../../../types'

/**
 * Sends an email using SMTP via standard `nodemailer`.
 *
 * This function is the standard implementation for Node.js environments, supporting
 * the full feature set of Nodemailer's SMTP transport.
 *
 * @param smtpConfig - The SMTP configuration options.
 * @param options - The email options.
 * @returns A promise that resolves to the sent message info from Nodemailer.
 */
export const sendSmtpNode = async (smtpConfig: SMTPOptions, options: EmailOptions) => {
  const nodeConfig = toNodemailerConfig(smtpConfig)
  const nodeOptions = toNodemailerMailOptions(options)

  const transporter = nodemailer.createTransport(nodeConfig)
  return await transporter.sendMail(nodeOptions)
}
