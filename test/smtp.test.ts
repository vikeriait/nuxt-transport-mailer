import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { TransportMailerError } from '../src/types'
import type { FetchError } from 'ofetch'

describe('nuxt-transport-mailer smtp driver', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('fails gracefully when SMTP server is unreachable', async () => {
    try {
      await $fetch('/api/mail/send', {
        method: 'POST',
        body: {
          to: 'recipient@example.com',
          subject: 'Test Subject',
          text: 'Test Body',
        },
      })
    }
    catch (error: unknown) {
      const err = (error as FetchError).data as TransportMailerError
      expect(err.statusCode).toBe(500)
      expect(err.message).toContain('SMTP Transport failed')
    }
  })
})
