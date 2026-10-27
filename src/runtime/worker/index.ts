import { sendSesEdge } from '../server/transports/ses.edge'
import { sendSmtpEdge } from '../server/transports/smtp.edge'
import type { AwsClient } from 'aws4fetch'
import type { WorkerMailerOptions } from 'worker-mailer'
import type { EmailOptions } from '../../types'

/**
 * Rate limiting binding of Cloudflare Workers (`ratelimits` in wrangler config).
 */
export interface MailRateLimiter {
  limit: (options: { key: string }) => Promise<{ success: boolean }>
}

/**
 * Configuration of the Worker mail handler, resolved per request from the Worker `env`.
 *
 * Unlike the Nuxt server API, recipients and sender are fixed here: `to`, `from`,
 * `cc` and `bcc` sent in the request body are ignored. Whoever solves the captcha
 * can only write to `to`, and only as `from`.
 */
export interface MailHandlerConfig {
  /**
   * The route path served by the handler.
   * @default '/api/mail/send'
   */
  route?: string

  /**
   * Fixed recipients of every email.
   */
  to: string | string[]

  /**
   * Fixed sender of every email.
   * Example: '"My App" <noreply@example.com>'
   */
  from: string

  /**
   * The transport used to send emails: `sesTransport(...)` or `smtpTransport(...)`.
   * Only the transport you import ends up in the Worker bundle.
   */
  transport: MailTransport

  /**
   * Captcha verification. Omit it to disable the check.
   */
  captcha?: {
    provider: 'turnstile' | 'recaptcha' | 'hcaptcha'
    secretKey: string
  }

  /**
   * Rate limiting binding, keyed by client IP. Omit it to disable the check.
   */
  rateLimiter?: MailRateLimiter

  /**
   * Maximum length of the raw request body, in characters.
   * @default 65536
   */
  maxBodyLength?: number

  /**
   * Maximum length of the subject.
   * @default 200
   */
  maxSubjectLength?: number

  /**
   * Called after a successful send, before the response. An error thrown here is
   * logged and does not turn the response into a failure: the email is already sent.
   */
  onSent?: (info: { messageId: string, request: Request, body: MailHandlerBody }) => void | Promise<void>
}

/**
 * Sends a validated email and returns its message id.
 */
export interface MailTransport {
  name: string
  send: (options: EmailOptions) => Promise<{ messageId: string }>
}

/**
 * Amazon SES transport, via `aws4fetch`.
 *
 * @param ses - The SES configuration.
 * @param ses.endpoint - Optional custom SES endpoint.
 * @param ses.clientConfig - The `aws4fetch` client configuration (credentials, region).
 */
export function sesTransport(ses: { endpoint?: string, clientConfig: ConstructorParameters<typeof AwsClient>[0] }): MailTransport {
  return { name: 'ses', send: options => sendSesEdge(ses, options) }
}

/**
 * SMTP transport, via `worker-mailer`.
 * WARNING: SMTP on Edge is currently only supported on Cloudflare (`connect()` API).
 *
 * @param smtp - The `worker-mailer` options.
 */
export function smtpTransport(smtp: WorkerMailerOptions): MailTransport {
  return { name: 'smtp', send: options => sendSmtpEdge(smtp, options) }
}

/**
 * Fields of the request body accepted by the Worker handler.
 */
export interface MailHandlerBody {
  subject: string
  text?: string
  html?: string
  replyTo?: string
}

/**
 * A Worker handler: returns a Response for the requests it serves, `undefined` otherwise,
 * so that several handlers can be chained in the same `fetch`.
 */
export type WorkerHandler<Env> = (request: Request, env: Env, ctx?: unknown) => Promise<Response | undefined>

const CAPTCHA_VERIFY_URLS = {
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  recaptcha: 'https://www.google.com/recaptcha/api/siteverify',
  hcaptcha: 'https://api.hcaptcha.com/siteverify',
} as const

/**
 * Creates a Cloudflare Worker handler for the mail endpoint, compatible with `useMailer`.
 *
 * The contract is the one of the Nuxt server API: same route, same body,
 * `{ success: true }` on success, a `{ statusCode, message }` error otherwise.
 * It runs without Nitro, so it fits the CPU limits of the Workers Free plan.
 *
 * @param resolveConfig - Builds the configuration from the Worker `env` (secrets, vars, bindings).
 * @returns A handler to call from the Worker `fetch`.
 */
export function createMailHandler<Env>(resolveConfig: (env: Env) => MailHandlerConfig): WorkerHandler<Env> {
  return async (request, env) => {
    const config = resolveConfig(env)

    if (new URL(request.url).pathname !== (config.route ?? '/api/mail/send')) return undefined
    if (request.method !== 'POST') return error(405, 'Method Not Allowed')

    const ip = request.headers.get('cf-connecting-ip') ?? ''
    if (config.rateLimiter) {
      const { success } = await config.rateLimiter.limit({ key: ip })
      if (!success) return error(429, 'Too Many Requests')
    }

    const raw = await request.text()
    if (raw.length > (config.maxBodyLength ?? 64 * 1024)) return error(413, 'Payload Too Large')

    let body: Record<string, unknown>
    try {
      body = JSON.parse(raw)
    }
    catch {
      return error(400, 'Validation Error')
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return error(400, 'Validation Error')

    // Honeypot: a bot filling the hidden field gets a fake success, so it does not learn to avoid it.
    if (body._gotcha) return json(200, { success: true, message: 'Sent' })

    if (config.captcha) {
      if (typeof body.captchaToken !== 'string' || body.captchaToken === '') return error(400, 'Captcha token is required')
      if (!await verifyCaptchaToken(config.captcha, body.captchaToken, ip)) return error(400, 'Invalid captcha')
    }

    const mail = parseBody(body, config.maxSubjectLength ?? 200)
    if (!mail) return error(400, 'Validation Error')

    const options = {
      from: config.from,
      to: config.to,
      subject: mail.subject,
      ...(mail.text ? { text: mail.text } : {}),
      ...(mail.html ? { html: mail.html } : {}),
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
    } as EmailOptions

    let messageId: string
    try {
      messageId = (await config.transport.send(options)).messageId
    }
    catch (e) {
      // Transport details go to the Worker logs, not to the visitor.
      console.error(`[nuxt-transport-mailer] ${config.transport.name} transport failed: ${(e as Error).message ?? e}`)
      return error(502, 'Failed to send email')
    }

    try {
      await config.onSent?.({ messageId, request, body: mail })
    }
    catch (e) {
      console.error(`[nuxt-transport-mailer] onSent failed: ${(e as Error).message ?? e}`)
    }

    // The result carries only the message id: the envelope would expose the fixed recipients.
    return json(200, { success: true, result: { messageId } })
  }
}

/**
 * Validates the accepted fields of the body. Recipients and sender are not among them.
 */
function parseBody(body: Record<string, unknown>, maxSubjectLength: number): MailHandlerBody | undefined {
  const { subject, text, html, replyTo } = body
  if (typeof subject !== 'string' || subject === '' || subject.length > maxSubjectLength) return undefined
  if (text !== undefined && typeof text !== 'string') return undefined
  if (html !== undefined && typeof html !== 'string') return undefined
  if (!text && !html) return undefined
  if (replyTo !== undefined && !isEmail(replyTo)) return undefined
  return { subject, text, html, replyTo } as MailHandlerBody
}

/**
 * Verifies a captcha token. The body is form-encoded, the format accepted by all three providers.
 */
async function verifyCaptchaToken(captcha: NonNullable<MailHandlerConfig['captcha']>, token: string, ip: string): Promise<boolean> {
  const form = new URLSearchParams({ secret: captcha.secretKey, response: token })
  if (ip) form.append('remoteip', ip)

  const response = await fetch(CAPTCHA_VERIFY_URLS[captcha.provider], { method: 'POST', body: form })
  if (!response.ok) return false
  const { success } = await response.json() as { success: boolean }
  return success === true
}

/**
 * Excludes what the transport would reject or what could inject further addresses
 * (commas, spaces, newlines): the real check is the reply that arrives.
 */
function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@,;<>"]+@[^\s",;<>@][^\s",.;<>@]*\.[^\s",;<>@]+$/.test(value)
}

function error(statusCode: number, message: string): Response {
  return json(statusCode, { statusCode, message })
}

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}
