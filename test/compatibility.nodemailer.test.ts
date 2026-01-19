import { describe, it, expect, vi } from 'vitest'
import { toNodemailerMailOptions, toNodemailerConfig } from '../src/runtime/server/utils/compatibility'
import type { EmailOptions, SMTPOptions } from '../src/types'

vi.mock('nitropack/runtime', () => ({
  useRuntimeConfig: () => ({ transportMailer: { driver: 'smtp' } }),
}))

describe('Compatibility -> Nodemailer', () => {
  describe('toNodemailerMailOptions', () => {
    it('preserves Nodemailer-style input', () => {
      const input = {
        from: 'Sender <sender@example.com>',
        to: 'recipient@example.com',
        replyTo: 'reply@example.com',
        subject: 'Test',
        text: 'Body',
      }

      const result = toNodemailerMailOptions(input)

      expect(result).toMatchObject({
        from: 'Sender <sender@example.com>',
        to: 'recipient@example.com',
        replyTo: 'reply@example.com',
        subject: 'Test',
        text: 'Body',
      })
    })

    it('converts WorkerMailer-style input to Nodemailer format', () => {
      const input = {
        from: { name: 'Sender', email: 'sender@example.com' },
        to: [{ name: 'Recipient', email: 'recipient@example.com' }],
        reply: { email: 'reply@example.com' },
        subject: 'Test',
        text: 'Body',
      }

      const result = toNodemailerMailOptions(input as EmailOptions)

      expect(result).toMatchObject({
        from: 'Sender <sender@example.com>',
        to: ['Recipient <recipient@example.com>'],
        replyTo: 'reply@example.com',
        subject: 'Test',
        text: 'Body',
      })
    })
  })

  describe('toNodemailerConfig', () => {
    it('converts WorkerMailer credentials to Nodemailer auth', () => {
      const config = {
        host: 'smtp.example.com',
        credentials: {
          username: 'user',
          password: 'pass',
        },
      }

      const result = toNodemailerConfig(config as SMTPOptions)

      expect(result).toMatchObject({
        host: 'smtp.example.com',
        auth: {
          user: 'user',
          pass: 'pass',
        },
      })
    })

    it('preserves existing Nodemailer auth', () => {
      const config = {
        host: 'smtp.example.com',
        auth: {
          user: 'user',
          pass: 'pass',
        },
      }

      const result = toNodemailerConfig(config)

      expect(result.auth).toEqual({
        user: 'user',
        pass: 'pass',
      })
    })
  })
})
