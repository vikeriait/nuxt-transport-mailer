import type { SentMessageInfo } from 'nodemailer'
import { toWorkerMailerConfig, toWorkerMailerMailOptions } from '../utils/compatibility'
import type { EmailOptions, SMTPOptions } from '../../../types'

export const sendSmtpEdge = async (smtpConfig: SMTPOptions, options: EmailOptions): Promise<SentMessageInfo> => {
  const { WorkerMailer } = await import('worker-mailer')

  const edgeConfig = toWorkerMailerConfig(smtpConfig)
  const mailOptions = toWorkerMailerMailOptions(options)

  const mailer = await WorkerMailer.connect(edgeConfig)
  await mailer.send(mailOptions)

  return {
    messageId: 'edge-mock-id',
    envelope: { from: mailOptions.from?.toString() || '', to: [] },
    accepted: [],
    rejected: [],
    pending: [],
    response: '250 OK',
  } as SentMessageInfo
}
