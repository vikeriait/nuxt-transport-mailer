import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, fetch } from '@nuxt/test-utils/e2e'

describe('CORS Security', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('enforces CORS headers for allowed origins', async () => {
    const response = await fetch('/api/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://example.com',
      },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'CORS Test',
        text: 'Body',
      }),
    })

    expect(response.headers.has('access-control-allow-origin')).toBe(true)
  })

  it('blocks requests from disallowed origins', async () => {
    const response = await fetch('/api/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://bad-origin.com',
      },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Blocked CORS Test',
        text: 'This should be blocked',
      }),
    }).catch(e => e.response)

    expect(response.headers.has('access-control-allow-origin')).toBe(false)
  })
})
