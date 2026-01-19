import * as nodemailer from 'nodemailer'
import { toNodemailerConfig, toNodemailerMailOptions } from '../utils/compatibility'
import type { EmailOptions, SMTPOptions } from '../../../types'

export const sendSmtpNode = async (smtpConfig: SMTPOptions, options: EmailOptions) => {
  const nodeConfig = toNodemailerConfig(smtpConfig)
  const nodeOptions = toNodemailerMailOptions(options)

  const transporter = nodemailer.createTransport(nodeConfig)
  return await transporter.sendMail(nodeOptions)
}
