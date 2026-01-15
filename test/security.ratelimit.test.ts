import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, fetch } from '@nuxt/test-utils/e2e'

describe('Rate Limiting Security', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    nuxtConfig: {
      transportMailer: {
        security: {
          rateLimiter: {
            tokensPerInterval: 1,
            interval: 15000,
          },
        },
      },
    },
  })

  it('enforces rate limiting', async () => {
    const validBody = {
      to: 'test@example.com',
      subject: 'Rate Limit Test',
      text: 'Body',
    }

    let response = await fetch('/api/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    }).catch(e => e.response)
    expect(response.status).toBe(200)

    response = await fetch('/api/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    }).catch(e => e.response)
    expect(response.status).toBe(200)

    response = await fetch('/api/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    })
    expect(response.status).toBe(429)
    expect(response.statusText).toBe('Too Many Requests')
  })
})
