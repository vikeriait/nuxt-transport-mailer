import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { TransportMailerError } from '../src/types'

describe('nuxt-transport-mailer module', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('rejects request without recipients', async () => {
    try {
      await $fetch('/api/mail/send', {
        method: 'POST',
        body: {
          subject: 'Test Subject',
          text: 'Test Body',
        },
      })
    }
    catch (error: unknown) {
      const err = error as TransportMailerError
      expect(err.statusCode).toBe(400)
      expect(err.data?.message).toContain('Missing recipient')
    }
  })
})
