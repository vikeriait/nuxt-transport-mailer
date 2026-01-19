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
