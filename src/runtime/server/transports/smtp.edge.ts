import type { SentMessageInfo } from 'nodemailer'
import { toWorkerMailerConfig, toWorkerMailerMailOptions } from '../utils/compatibility'
import type { EmailOptions, SMTPOptions } from '../../../types'

/**
 * Sends an email using SMTP via `worker-mailer` for Edge compatibility.
 *
 * IMPORTANT: SMTP in Edge mode currently works ONLY on Cloudflare (Workers/Pages).
 * This is because `worker-mailer` relies on Cloudflare's specific `connect()` API
 * to establish TCP connections, which is not standard across all edge providers.
 *
 * @param smtpConfig - The SMTP configuration options.
 * @param options - The email options.
 * @returns A promise that resolves to the sent message info (mocked for edge as `worker-mailer` might not return full details).
 */
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
