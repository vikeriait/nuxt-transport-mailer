import { describe, it, expect, vi } from 'vitest'
import { toWorkerMailerMailOptions, toWorkerMailerConfig } from '../src/runtime/server/utils/compatibility'
import type { EmailOptions, SMTPOptions } from '../src/types'

vi.mock('nitropack/runtime', () => ({
  useRuntimeConfig: () => ({ transportMailer: { driver: 'smtp' } }),
}))

describe('Compatibility -> WorkerMailer', () => {
  describe('toWorkerMailerMailOptions', () => {
    it('converts Nodemailer-style input to WorkerMailer format', () => {
      const input = {
        from: 'Sender <sender@example.com>',
        to: 'recipient@example.com',
        cc: ['cc1@example.com'],
        replyTo: 'reply@example.com',
        subject: 'Test',
        text: 'Body',
      }

      const result = toWorkerMailerMailOptions(input)

      expect(result).toMatchObject({
        from: { name: 'Sender', email: 'sender@example.com' },
        to: { email: 'recipient@example.com' },
        cc: [{ email: 'cc1@example.com' }],
        reply: { email: 'reply@example.com' },
        subject: 'Test',
        text: 'Body',
      })
    })

    it('preserves WorkerMailer-style input', () => {
      const input = {
        from: { name: 'Sender', email: 'sender@example.com' },
        to: [{ name: 'Recipient', email: 'recipient@example.com' }],
        reply: { email: 'reply@example.com' },
        subject: 'Test',
        text: 'Body',
      }

      const result = toWorkerMailerMailOptions(input as EmailOptions)

      expect(result).toMatchObject({
        from: { name: 'Sender', email: 'sender@example.com' },
        to: [{ name: 'Recipient', email: 'recipient@example.com' }],
        reply: { email: 'reply@example.com' },
        subject: 'Test',
        text: 'Body',
      })
    })
  })

  describe('toWorkerMailerConfig', () => {
    it('converts Nodemailer auth to WorkerMailer credentials', () => {
      const config = {
        host: 'smtp.example.com',
        auth: {
          user: 'user',
          pass: 'pass',
        },
      }

      const result = toWorkerMailerConfig(config)

      expect(result).toMatchObject({
        host: 'smtp.example.com',
        credentials: {
          username: 'user',
          password: 'pass',
        },
      })
    })

    it('preserves WorkerMailer credentials', () => {
      const config = {
        host: 'smtp.example.com',
        credentials: {
          username: 'user',
          password: 'pass',
        },
      }

      const result = toWorkerMailerConfig(config as SMTPOptions)

      expect(result.credentials).toEqual({
        username: 'user',
        password: 'pass',
      })
    })
  })
})
