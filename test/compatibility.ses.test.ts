import { describe, it, expect, vi } from 'vitest'
import { toSESMailOptions, toNodemailerMailOptions } from '../src/runtime/server/utils/compatibility'
import type { EmailOptions, ModuleOptions } from '../src/types'

vi.mock('nitropack/runtime', () => ({
  useRuntimeConfig: () => ({ transportMailer: { driver: 'ses' } }),
}))

describe('Compatibility -> SES (toSESMailOptions)', () => {
  it('converts Nodemailer-style input (strings) to SES format', () => {
    const input = {
      from: 'Sender <sender@example.com>',
      to: 'recipient@example.com',
      cc: ['cc1@example.com', 'cc2@example.com'],
      bcc: 'bcc@example.com',
      replyTo: 'reply@example.com',
      subject: 'Test Subject',
      text: 'Test Text Body',
      html: '<p>Test HTML Body</p>',
    }

    const result = toSESMailOptions(input)

    expect(result).toEqual({
      FromEmailAddress: 'Sender <sender@example.com>',
      Destination: {
        ToAddresses: ['recipient@example.com'],
        CcAddresses: ['cc1@example.com', 'cc2@example.com'],
        BccAddresses: ['bcc@example.com'],
      },
      ReplyToAddresses: ['reply@example.com'],
      Content: {
        Simple: {
          Subject: { Data: 'Test Subject' },
          Body: {
            Text: { Data: 'Test Text Body' },
            Html: { Data: '<p>Test HTML Body</p>' },
          },
        },
      },
    })
  })

  it('converts WorkerMailer-style input (objects) to SES format', () => {
    const input = {
      from: { name: 'Sender', email: 'sender@example.com' },
      to: [{ name: 'Recipient', email: 'recipient@example.com' }],
      cc: { email: 'cc@example.com' },
      bcc: [{ email: 'bcc1@example.com' }, { name: 'BCC 2', email: 'bcc2@example.com' }],
      reply: { email: 'reply@example.com' }, // WorkerMailer uses 'reply'
      subject: 'Test Subject',
      text: 'Test Text Body',
      html: '<p>Test HTML Body</p>',
    }

    const result = toSESMailOptions(input as EmailOptions)

    expect(result).toEqual({
      FromEmailAddress: 'Sender <sender@example.com>',
      Destination: {
        ToAddresses: ['Recipient <recipient@example.com>'],
        CcAddresses: ['cc@example.com'],
        BccAddresses: ['bcc1@example.com', 'BCC 2 <bcc2@example.com>'],
      },
      ReplyToAddresses: ['reply@example.com'],
      Content: {
        Simple: {
          Subject: { Data: 'Test Subject' },
          Body: {
            Text: { Data: 'Test Text Body' },
            Html: { Data: '<p>Test HTML Body</p>' },
          },
        },
      },
    })
  })

  it('converts Mixed input (strings and objects) to SES format', () => {
    const input = {
      from: 'Sender <sender@example.com>',
      to: [{ name: 'Recipient', email: 'recipient@example.com' }],
      cc: 'cc@example.com',
      replyTo: { name: 'Support', email: 'support@example.com' },
      subject: 'Test Subject',
      text: 'Test Text Body',
    }

    const result = toSESMailOptions(input as EmailOptions)

    expect(result).toEqual({
      FromEmailAddress: 'Sender <sender@example.com>',
      Destination: {
        ToAddresses: ['Recipient <recipient@example.com>'],
        CcAddresses: ['cc@example.com'],
        BccAddresses: undefined,
      },
      ReplyToAddresses: ['Support <support@example.com>'],
      Content: {
        Simple: {
          Subject: { Data: 'Test Subject' },
          Body: {
            Text: { Data: 'Test Text Body' },
          },
        },
      },
    })
  })

  it('preserves extra SES options from input.ses', () => {
    const input = {
      from: 'Sender <sender@example.com>',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test Body',
      ses: {
        ConfigurationSetName: 'MyConfigSet',
        EmailTags: [{ Name: 'Tag1', Value: 'Value1' }],
      },
    }

    const result = toSESMailOptions(input)

    expect(result.ConfigurationSetName).toBe('MyConfigSet')
    expect(result.EmailTags).toEqual([{ Name: 'Tag1', Value: 'Value1' }])
  })

  it('preserves extra root options (merged into result)', () => {
    const input = {
      from: 'Sender <sender@example.com>',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test Body',
      ConfigurationSetName: 'MyRootConfigSet',
      EmailTags: [{ Name: 'RootTag', Value: 'RootValue' }],
    }

    const result = toSESMailOptions(input)

    expect(result.ConfigurationSetName).toBe('MyRootConfigSet')
    expect(result.EmailTags).toEqual([{ Name: 'RootTag', Value: 'RootValue' }])
  })
})

describe('Compatibility -> SES Config Merging', () => {
  const mockSesConfig: ModuleOptions['ses'] = {
    commandInput: {
      ConfigurationSetName: 'MyConfigSet',
      EmailTags: [{ Name: 'Env', Value: 'Test' }],
    },
  }

  const mockOptions = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test Subject',
    text: 'Test Body',
  }

  describe('toNodemailerMailOptions', () => {
    it('merges sesConfig.commandInput into ses property', () => {
      const result = toNodemailerMailOptions(mockOptions, mockSesConfig)
      expect(result.ses).toBeDefined()
      expect(result.ses).toEqual(expect.objectContaining({
        ConfigurationSetName: 'MyConfigSet',
        EmailTags: [{ Name: 'Env', Value: 'Test' }],
      }))
    })

    it('prioritizes per-request ses options over global config', () => {
      const optionsWithSes = {
        ...mockOptions,
        ses: {
          ConfigurationSetName: 'OverrideSet',
        },
      }
      const result = toNodemailerMailOptions(optionsWithSes, mockSesConfig)
      expect(result.ses?.ConfigurationSetName).toBe('OverrideSet')
      expect(result.ses?.EmailTags).toEqual([{ Name: 'Env', Value: 'Test' }]) // Merged
    })
  })

  describe('toSESMailOptions', () => {
    it('merges sesConfig.commandInput into the root of the request', () => {
      const result = toSESMailOptions(mockOptions, mockSesConfig)
      expect(result.ConfigurationSetName).toBe('MyConfigSet')
      expect(result.EmailTags).toEqual([{ Name: 'Env', Value: 'Test' }])
    })

    it('prioritizes per-request ses options over global config', () => {
      const optionsWithSes = {
        ...mockOptions,
        ses: {
          ConfigurationSetName: 'OverrideSet',
        },
      }
      const result = toSESMailOptions(optionsWithSes, mockSesConfig)
      expect(result.ConfigurationSetName).toBe('OverrideSet')
      expect(result.EmailTags).toEqual([{ Name: 'Env', Value: 'Test' }])
    })
  })
})
