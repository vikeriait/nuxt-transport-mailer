import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMailHandler, sesTransport, type MailHandlerConfig } from '../src/runtime/worker'

const globalFetch = vi.fn()
vi.stubGlobal('fetch', globalFetch)

const baseConfig: MailHandlerConfig = {
  to: 'owner@example.com',
  from: 'Site <noreply@example.com>',
  transport: sesTransport({
    clientConfig: {
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      region: 'eu-west-1',
    },
  }),
  captcha: {
    provider: 'turnstile',
    secretKey: 'captcha-secret',
  },
}

const validBody = {
  subject: 'Hello',
  html: '<p>Message</p>',
  replyTo: 'visitor@example.com',
  captchaToken: 'token',
}

const post = (body: unknown, path = '/api/mail/send') => new Request(`https://example.com${path}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.1' },
  body: typeof body === 'string' ? body : JSON.stringify(body),
})

const captchaResponse = (success: boolean) => new Response(JSON.stringify({ success }))
const sesResponse = () => new Response(JSON.stringify({ MessageId: 'ses-id' }))

const sesRequestBody = async () => {
  const request = globalFetch.mock.calls.map(([input]) => input).find(input => input instanceof Request && input.url.includes('amazonaws.com')) as Request
  return JSON.parse(await request.text())
}

describe('createMailHandler', () => {
  beforeEach(() => {
    globalFetch.mockReset()
  })

  it('ignores requests to other routes', async () => {
    const handler = createMailHandler(() => baseConfig)

    await expect(handler(post(validBody, '/api/other'), {})).resolves.toBeUndefined()
    expect(globalFetch).not.toHaveBeenCalled()
  })

  it('serves a custom route', async () => {
    globalFetch.mockResolvedValueOnce(captchaResponse(true)).mockResolvedValueOnce(sesResponse())
    const handler = createMailHandler(() => ({ ...baseConfig, route: '/api/contact' }))

    const response = await handler(post(validBody, '/api/contact'), {})

    expect(response?.status).toBe(200)
  })

  it('rejects methods other than POST', async () => {
    const handler = createMailHandler(() => baseConfig)

    const response = await handler(new Request('https://example.com/api/mail/send'), {})

    expect(response?.status).toBe(405)
  })

  it('rejects requests over the rate limit', async () => {
    const limit = vi.fn().mockResolvedValue({ success: false })
    const handler = createMailHandler(() => ({ ...baseConfig, rateLimiter: { limit } }))

    const response = await handler(post(validBody), {})

    expect(response?.status).toBe(429)
    expect(limit).toHaveBeenCalledWith({ key: '203.0.113.1' })
  })

  it('rejects bodies over the maximum length', async () => {
    const handler = createMailHandler(() => ({ ...baseConfig, maxBodyLength: 10 }))

    const response = await handler(post(validBody), {})

    expect(response?.status).toBe(413)
  })

  it('rejects malformed JSON', async () => {
    const handler = createMailHandler(() => baseConfig)

    const response = await handler(post('{not json'), {})

    expect(response?.status).toBe(400)
    await expect(response?.json()).resolves.toEqual({ statusCode: 400, message: 'Validation Error' })
  })

  it('fakes a success when the honeypot is filled', async () => {
    const handler = createMailHandler(() => baseConfig)

    const response = await handler(post({ ...validBody, _gotcha: 'bot' }), {})

    expect(response?.status).toBe(200)
    await expect(response?.json()).resolves.toEqual({ success: true, message: 'Sent' })
    expect(globalFetch).not.toHaveBeenCalled()
  })

  it('requires the captcha token', async () => {
    const handler = createMailHandler(() => baseConfig)

    const response = await handler(post({ ...validBody, captchaToken: undefined }), {})

    expect(response?.status).toBe(400)
    await expect(response?.json()).resolves.toMatchObject({ message: 'Captcha token is required' })
  })

  it('rejects an invalid captcha', async () => {
    globalFetch.mockResolvedValueOnce(captchaResponse(false))
    const handler = createMailHandler(() => baseConfig)

    const response = await handler(post(validBody), {})

    expect(response?.status).toBe(400)
    await expect(response?.json()).resolves.toMatchObject({ message: 'Invalid captcha' })
  })

  it('verifies the captcha with a form-encoded body', async () => {
    globalFetch.mockResolvedValueOnce(captchaResponse(true)).mockResolvedValueOnce(sesResponse())
    const handler = createMailHandler(() => baseConfig)

    await handler(post(validBody), {})

    const [url, init] = globalFetch.mock.calls[0]!
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      secret: 'captcha-secret',
      response: 'token',
      remoteip: '203.0.113.1',
    })
  })

  it('skips the captcha when not configured', async () => {
    globalFetch.mockResolvedValueOnce(sesResponse())
    const handler = createMailHandler(() => ({ ...baseConfig, captcha: undefined }))

    const response = await handler(post({ ...validBody, captchaToken: undefined }), {})

    expect(response?.status).toBe(200)
  })

  it.each([
    ['a missing subject', { subject: undefined }],
    ['a subject over the maximum length', { subject: 'x'.repeat(201) }],
    ['a missing body', { html: undefined }],
    ['a non-string body', { html: 42 }],
    ['an invalid replyTo', { replyTo: 'a@example.com, b@example.com' }],
  ])('rejects %s', async (_, override) => {
    globalFetch.mockResolvedValueOnce(captchaResponse(true))
    const handler = createMailHandler(() => baseConfig)

    const response = await handler(post({ ...validBody, ...override }), {})

    expect(response?.status).toBe(400)
  })

  it('sends to the configured recipient and sender, ignoring those in the body', async () => {
    globalFetch.mockResolvedValueOnce(captchaResponse(true)).mockResolvedValueOnce(sesResponse())
    const handler = createMailHandler(() => baseConfig)

    const response = await handler(post({
      ...validBody,
      to: 'victim@example.com',
      cc: 'victim@example.com',
      bcc: 'victim@example.com',
      from: 'spoof@example.com',
    }), {})

    expect(response?.status).toBe(200)
    const ses = await sesRequestBody()
    expect(ses.FromEmailAddress).toBe('Site <noreply@example.com>')
    expect(ses.Destination.ToAddresses).toEqual(['owner@example.com'])
    expect(ses.Destination.CcAddresses).toBeUndefined()
    expect(ses.Destination.BccAddresses).toBeUndefined()
    expect(ses.ReplyToAddresses).toEqual(['visitor@example.com'])
    expect(ses.Content.Simple.Subject.Data).toBe('Hello')
  })

  it('accepts a custom transport', async () => {
    const send = vi.fn().mockResolvedValue({ messageId: 'custom-id' })
    const handler = createMailHandler(() => ({ ...baseConfig, captcha: undefined, transport: { name: 'custom', send } }))

    const response = await handler(post({ ...validBody, to: 'victim@example.com' }), {})

    await expect(response?.json()).resolves.toEqual({ success: true, result: { messageId: 'custom-id' } })
    expect(send).toHaveBeenCalledWith({
      from: 'Site <noreply@example.com>',
      to: 'owner@example.com',
      subject: 'Hello',
      html: '<p>Message</p>',
      replyTo: 'visitor@example.com',
    })
  })

  it('returns only the message id', async () => {
    globalFetch.mockResolvedValueOnce(captchaResponse(true)).mockResolvedValueOnce(sesResponse())
    const handler = createMailHandler(() => baseConfig)

    const response = await handler(post(validBody), {})

    await expect(response?.json()).resolves.toEqual({ success: true, result: { messageId: 'ses-id' } })
  })

  it('resolves the configuration from env', async () => {
    globalFetch.mockResolvedValueOnce(captchaResponse(true)).mockResolvedValueOnce(sesResponse())
    const handler = createMailHandler((env: { CONTACT_EMAIL: string }) => ({ ...baseConfig, to: env.CONTACT_EMAIL }))

    await handler(post(validBody), { CONTACT_EMAIL: 'env@example.com' })

    expect((await sesRequestBody()).Destination.ToAddresses).toEqual(['env@example.com'])
  })

  it('hides transport errors from the response', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    globalFetch
      .mockResolvedValueOnce(captchaResponse(true))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Email address is not verified' }), { status: 400 }))
    const handler = createMailHandler(() => baseConfig)

    const response = await handler(post(validBody), {})

    expect(response?.status).toBe(502)
    await expect(response?.json()).resolves.toEqual({ statusCode: 502, message: 'Failed to send email' })
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('not verified'))
    consoleError.mockRestore()
  })

  it('calls onSent after a successful send', async () => {
    globalFetch.mockResolvedValueOnce(captchaResponse(true)).mockResolvedValueOnce(sesResponse())
    const onSent = vi.fn()
    const handler = createMailHandler(() => ({ ...baseConfig, onSent }))

    await handler(post(validBody), {})

    expect(onSent).toHaveBeenCalledWith(expect.objectContaining({
      messageId: 'ses-id',
      body: { subject: 'Hello', html: '<p>Message</p>', replyTo: 'visitor@example.com' },
    }))
  })

  it('keeps the success when onSent throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    globalFetch.mockResolvedValueOnce(captchaResponse(true)).mockResolvedValueOnce(sesResponse())
    const handler = createMailHandler(() => ({ ...baseConfig, onSent: () => {
      throw new Error('hook')
    } }))

    const response = await handler(post(validBody), {})

    expect(response?.status).toBe(200)
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('onSent failed'))
    consoleError.mockRestore()
  })
})
