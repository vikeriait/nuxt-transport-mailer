import { isNode, provider } from 'std-env'
import { useRuntimeConfig } from 'nitropack/runtime'
import { defu } from 'defu'
import type Mail from 'nodemailer/lib/mailer'
import type SESTransport from 'nodemailer/lib/ses-transport'
import type { EmailOptions as WorkerMailerEmailOptions } from 'worker-mailer'
import type { EmailOptions, ModuleOptions } from '../../../types'
import { toAddressOrArray, toAddressString } from './converters'

export * from './converters'

/**
 * Determines if the current execution environment is considered an "Edge" environment.
 *
 * This checks:
 * 1. The `edge` configuration option in `transportMailer` (handles both boolean and "true"/"false" strings from ENV).
 * 2. If `isNode` is false.
 * 3. If the platform provider matches known edge providers (Cloudflare Workers/Pages, Vercel, Netlify).
 *
 * @returns {boolean} True if running in an edge environment, false otherwise.
 */
export const isEdgeEnvironment = (): boolean => {
  const edge = useRuntimeConfig().transportMailer?.edge

  if (edge === true || edge === 'true') {
    return true
  }
  if (edge === false || edge === 'false') {
    return false
  }

  return !isNode || provider === 'cloudflare_workers' || provider === 'cloudflare_pages' || provider === 'vercel' || provider === 'netlify'
}

/**
 * Converts generic EmailOptions to Nodemailer compatible options.
 *
 * Normalizes address fields to strings or arrays of strings as expected by Nodemailer.
 * Also merges SES-specific command inputs if the driver is set to 'ses'.
 *
 * @param options - The generic email options.
 * @param sesConfig - Optional SES configuration to merge default command inputs.
 * @returns {SESTransport.MailOptions} Options ready for Nodemailer.
 */
export const toNodemailerMailOptions = (options: EmailOptions, sesConfig?: ModuleOptions['ses']): SESTransport.MailOptions => {
  const { ses, ...opts } = options as SESTransport.MailOptions & WorkerMailerEmailOptions

  const nodemailerOptions = {
    ...opts,
    from: toAddressString(opts.from!),
    to: toAddressOrArray(opts.to),
    replyTo: toAddressOrArray(opts.reply || opts.replyTo),
    cc: toAddressOrArray(opts.cc),
    bcc: toAddressOrArray(opts.bcc),
    subject: opts.subject,
    text: opts.text as Mail.Options['text'],
    html: opts.html as Mail.Options['html'],
    headers: opts.headers as Mail.Options['headers'],
    attachments: opts.attachments as Mail.Options['attachments'],
  } as SESTransport.MailOptions

  if (sesConfig && useRuntimeConfig().transportMailer?.driver === 'ses') {
    nodemailerOptions.ses = defu(ses, sesConfig.commandInput ?? {})
  }

  return nodemailerOptions
}
