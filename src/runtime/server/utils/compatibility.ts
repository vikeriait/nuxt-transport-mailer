import { isNode, provider } from 'std-env'
import type SMTPConnection from 'nodemailer/lib/smtp-connection'
import type { WorkerMailerOptions, EmailOptions as WorkerMailerEmailOptions, User } from 'worker-mailer'
import type Mail from 'nodemailer/lib/mailer'
import type { Address } from 'nodemailer/lib/mailer'
import type { SendEmailRequest, Body, SESv2ClientConfig } from '@aws-sdk/client-sesv2'
import type { EmailOptions, SMTPOptions, ModuleOptions } from '../../../types'
import type SESTransport from 'nodemailer/lib/ses-transport'
import type { AwsClient } from 'aws4fetch'
import { defu } from 'defu'
import { useRuntimeConfig } from 'nitropack/runtime'

/**
 * Determines if the current execution environment is considered an "Edge" environment.
 *
 * This checks:
 * 1. The `edge` configuration option in `transportMailer`.
 * 2. If `isNode` is false.
 * 3. If the platform provider matches known edge providers (Cloudflare Workers/Pages, Vercel, Netlify).
 *
 * @returns {boolean} True if running in an edge environment, false otherwise.
 */
export const isEdgeEnvironment = (): boolean => {
  const edge = useRuntimeConfig().transportMailer?.edge
  if (edge !== undefined) {
    return edge
  }

  return !isNode || provider === 'cloudflare_workers' || provider === 'cloudflare_pages' || provider === 'vercel' || provider === 'netlify'
}

/**
 * Normalizes SES configuration for Node.js environments (using @aws-sdk/client-sesv2).
 *
 * It handles the flattening of credentials if they are provided at the top level of the client config
 * instead of nested within a `credentials` object.
 *
 * @param sesConfig - The module's SES configuration.
 * @returns {SESv2ClientConfig} The configuration object suitable for `SESv2Client`.
 */
export const getSesClientConfigNode = (sesConfig: ModuleOptions['ses']): SESv2ClientConfig => {
  let clientConfig = sesConfig?.clientConfig || {}

  // @ts-expect-error - Handling potential flat config from ModuleOptions
  if (clientConfig.accessKeyId && clientConfig.secretAccessKey && !clientConfig.credentials) {
    clientConfig = defu(clientConfig, {
      credentials: {
        // @ts-expect-error - Handling potential flat config from ModuleOptions
        accessKeyId: clientConfig.accessKeyId,
        // @ts-expect-error - Handling potential flat config from ModuleOptions
        secretAccessKey: clientConfig.secretAccessKey,
        // @ts-expect-error - Handling potential flat config from ModuleOptions
        sessionToken: clientConfig.sessionToken,
      },
    })
  }
  return clientConfig as SESv2ClientConfig
}

/**
 * Normalizes SES configuration for Edge environments (using aws4fetch).
 *
 * Extracts credentials and region from various potential locations in the config object
 * to create a compatible configuration for `AwsClient`.
 *
 * @param sesConfig - The module's SES configuration.
 * @returns {ConstructorParameters<typeof AwsClient>[0]} The configuration object for `AwsClient`.
 */
export const getSesClientConfigEdge = (sesConfig: ModuleOptions['ses']): ConstructorParameters<typeof AwsClient>[0] => {
  // @ts-expect-error - Accessing potential credential properties that might exist on the union type
  const accessKeyId = sesConfig?.clientConfig?.accessKeyId || sesConfig?.clientConfig?.credentials?.accessKeyId
  // @ts-expect-error - Accessing potential credential properties that might exist on the union type
  const secretAccessKey = sesConfig?.clientConfig?.secretAccessKey || sesConfig?.clientConfig?.credentials?.secretAccessKey
  // @ts-expect-error - Accessing potential credential properties that might exist on the union type
  const sessionToken = sesConfig?.clientConfig?.sessionToken || sesConfig?.clientConfig?.credentials?.sessionToken
  const region = sesConfig?.clientConfig?.region

  return {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region,
    service: 'ses',
    ...sesConfig?.clientConfig,
  } as ConstructorParameters<typeof AwsClient>[0]
}

/**
 * Converts standard SMTP configuration options to `worker-mailer` options.
 *
 * Maps `auth.user`/`auth.pass` from Nodemailer style to `credentials.username`/`credentials.password`
 * expected by `worker-mailer`.
 *
 * NOTE: SMTP on Edge (via worker-mailer) is currently only supported on Cloudflare.
 *
 * @param config - The generic SMTP options.
 * @returns {WorkerMailerOptions} Options compatible with `worker-mailer`.
 */
export const toWorkerMailerConfig = (config: SMTPOptions): WorkerMailerOptions => {
  const smtpConfig = config as SMTPConnection.Options
  const workerConfig = config as WorkerMailerOptions

  const auth = smtpConfig.auth as SMTPConnection.Options['auth']
  const hasUserPass = auth && typeof auth === 'object' && 'user' in auth && 'pass' in auth

  return {
    credentials:
      workerConfig.credentials
      || (
        hasUserPass
          ? {
              username: auth.user,
              password: auth.pass,
            } as WorkerMailerOptions['credentials']
          : undefined
      ),

    ...config,
  } as WorkerMailerOptions
}

/**
 * Converts generic SMTP configuration to Nodemailer options.
 *
 * Ensures that if `worker-mailer` style credentials are provided, they are mapped back to
 * Nodemailer's `auth` object structure.
 *
 * @param config - The generic SMTP options.
 * @returns {SMTPConnection.Options} Options compatible with Nodemailer.
 */
export const toNodemailerConfig = (config: SMTPOptions): SMTPConnection.Options => {
  const smtpConfig = config as SMTPConnection.Options
  const workerConfig = config as WorkerMailerOptions

  return {
    auth:
      smtpConfig.auth
      || (
        workerConfig.credentials
          ? {
              user: workerConfig.credentials.username,
              pass: workerConfig.credentials.password,
            } as SMTPConnection.Options['auth']
          : undefined
      ),

    ...config,
  } as SMTPConnection.Options
}

const toUser = (addr: string | Address | User): User => {
  if (typeof addr === 'string') {
    const match = addr.match(/^([^<]*)<([^>]+)>$/)
    if (match && match.length >= 3) {
      return {
        name: match[1]!.trim(),
        email: match[2]!.trim(),
      }
    }
    return { email: addr }
  }

  if ('email' in addr) {
    return addr as User
  }

  return {
    name: (addr as Address).name,
    email: (addr as Address).address,
  }
}

const toAddressString = (user: string | User | Address): string => {
  if (typeof user === 'string') return user

  const email = (user as User).email || (user as Address).address
  const name = user.name
  if (name) {
    return `${name} <${email}>`
  }

  return email
}

const toUserOrArray = (input: string | Address | User | (string | Address | User)[] | undefined): User | User[] | undefined => {
  if (!input) return undefined

  if (Array.isArray(input)) {
    return input.map(toUser)
  }

  return toUser(input)
}

const toAddressOrArray = (input: string | Address | User | (string | Address | User)[] | undefined): string | string[] | undefined => {
  if (!input) return undefined

  if (Array.isArray(input)) {
    return input.map(toAddressString)
  }

  return toAddressString(input)
}

/**
 * Helper to convert various address formats into an array of address strings.
 *
 * @param input - The address(es) to convert.
 * @returns {string[] | undefined} An array of formatted address strings or undefined.
 */
export const toAddressStringArray = (input: string | Address | User | (string | Address | User)[] | undefined): string[] | undefined => {
  if (!input) return undefined

  const arr = Array.isArray(input) ? input : [input]
  return arr.map(toAddressString)
}

const toSingleUser = (input: string | Address | User | (string | Address | User)[] | undefined): User | undefined => {
  if (!input) return undefined

  if (Array.isArray(input)) {
    return input.length > 0 ? toUser(input[0]!) : undefined
  }

  return toUser(input)
}

/**
 * Converts generic EmailOptions to `worker-mailer` compatible options.
 *
 * Handles normalizing fields like `from`, `to`, `cc`, `bcc` to the specific objects/arrays
 * required by `worker-mailer`.
 *
 * @param options - The generic email options.
 * @returns {WorkerMailerEmailOptions} Options ready for `worker-mailer`.
 */
export const toWorkerMailerMailOptions = (options: EmailOptions): WorkerMailerEmailOptions => {
  const opts = options as Mail.Options & WorkerMailerEmailOptions

  return {
    ...opts,
    from: toSingleUser(opts.from)!,
    to: toUserOrArray(opts.to)!,
    reply: toSingleUser(opts.replyTo || opts.reply),
    cc: toUserOrArray(opts.cc),
    bcc: toUserOrArray(opts.bcc),
    subject: opts.subject!,
    text: opts.text as WorkerMailerEmailOptions['text'],
    html: opts.html as WorkerMailerEmailOptions['html'],
    headers: opts.headers as Record<string, string>,
    attachments: opts.attachments as WorkerMailerEmailOptions['attachments'],
  }
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

/**
 * Converts generic EmailOptions to an AWS SES V2 `SendEmailRequest` object.
 *
 * This is used for the Edge SES transport where we construct the raw API request manually.
 * It maps email fields to the `Destination` and `Content` structures required by the AWS SES V2 API.
 *
 * @param options - The generic email options.
 * @param sesConfig - Optional SES configuration to merge default command inputs.
 * @returns {SendEmailRequest} The request object for the SES V2 API.
 */
export const toSESMailOptions = (options: EmailOptions, sesConfig?: ModuleOptions['ses']): SendEmailRequest => {
  const {
    from,
    to,
    cc,
    bcc,
    reply,
    replyTo,
    subject,
    text,
    html,
    headers,
    attachments,
    ses,
    ...rest
  } = options as SESTransport.MailOptions & WorkerMailerEmailOptions

  const body: Body = {}
  if (text) {
    body.Text = {
      Data: text as string,
    }
  }
  if (html) {
    body.Html = {
      Data: html as string,
    }
  }

  const request: SendEmailRequest = {
    ...rest,
    ...ses,
    FromEmailAddress: toAddressString(from!),
    Destination: {
      ToAddresses: toAddressStringArray(to),
      CcAddresses: toAddressStringArray(cc),
      BccAddresses: toAddressStringArray(bcc),
    },
    ReplyToAddresses: toAddressStringArray(reply || replyTo),
    Content: {
      Simple: {
        Subject: {
          Data: subject,
        },
        Body: body,
      },
    },
  }

  return defu(request, sesConfig?.commandInput ?? {})
}
