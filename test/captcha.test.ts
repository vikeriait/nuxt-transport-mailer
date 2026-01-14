import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifyCaptcha } from '../src/runtime/server/utils/captcha'

// Mock h3
vi.mock('h3', async () => {
  const actual = await vi.importActual('h3')
  return {
    ...actual,
    getRequestIP: vi.fn(() => '127.0.0.1'),
  }
})

// Mock global $fetch
const globalFetch = vi.fn()
vi.stubGlobal('$fetch', globalFetch)

describe('verifyCaptcha utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing if captcha is disabled', async () => {
    const event = {} as never
    const security = { captcha: { enabled: false } }

    await expect(verifyCaptcha(event, undefined, security)).resolves.toBeUndefined()
    expect(globalFetch).not.toHaveBeenCalled()
  })

  it('throws error if token is missing', async () => {
    const event = {} as never
    const security = {
      captcha: {
        enabled: true,
        provider: 'turnstile' as const,
        secretKey: 'secret',
      },
    }

    await expect(verifyCaptcha(event, undefined, security)).rejects.toThrow('Captcha token is required')
  })

  it('throws error if provider is invalid', async () => {
    const event = {} as never
    const security = {
      captcha: {
        enabled: true,
        provider: 'invalid' as never,
        secretKey: 'secret',
      },
    }

    await expect(verifyCaptcha(event, 'token', security)).rejects.toThrow('Captcha provider not valid')
  })

  it('calls turnstile verification and succeeds', async () => {
    const event = {} as never
    const security = {
      captcha: {
        enabled: true,
        provider: 'turnstile' as const,
        secretKey: 'secret-key',
      },
    }

    globalFetch.mockResolvedValueOnce({ success: true })

    await verifyCaptcha(event, 'test-token', security)

    expect(globalFetch).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
        body: {
          secret: 'secret-key',
          response: 'test-token',
          remoteip: '127.0.0.1',
        },
      }),
    )
  })

  it('throws error if verification fails', async () => {
    const event = {} as never
    const security = {
      captcha: {
        enabled: true,
        provider: 'recaptcha' as const,
        secretKey: 'secret-key',
      },
    }

    globalFetch.mockResolvedValueOnce({ success: false })

    await expect(verifyCaptcha(event, 'test-token', security)).rejects.toThrow('Invalid captcha')
  })
})
