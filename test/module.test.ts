import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { TransportMailerError } from '../src/types'
import type * as z from 'zod'
import type { FetchError } from 'ofetch'

describe('nuxt-transport-mailer module', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('rejects request with validation errors (Zod)', async () => {
    try {
      await $fetch('/api/mail/send', {
        method: 'POST',
        body: {
          subject: 'Test Subject',
          text: 'Test Body',
          // Missing 'to'
        },
      })
    }
    catch (error: unknown) {
      const err = (error as FetchError).data as TransportMailerError
      expect(err.statusCode).toBe(400)

      const issues = err.data as z.core.$ZodIssue[]
      expect(Array.isArray(issues)).toBe(true)
      expect(issues[0]?.message).toContain('At least one recipient')
    }
  })

  it('handles honeypot silently (returns success)', async () => {
    const response = await $fetch('/api/mail/send', {
      method: 'POST',
      body: {
        to: 'test@example.com',
        subject: 'Spam',
        text: 'Spam content',
        _gotcha: 'I am a bot', // Honeypot field
      },
    })

    expect(response).toEqual({ success: true, message: 'Sent' })
  })
})
