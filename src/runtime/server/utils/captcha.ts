import { createError, getRequestIP } from 'h3'
import type { H3Event } from 'h3'
import type { ModuleOptions } from '../../../types'
import { captchaVerificationSchema } from './schemas'
import * as z from 'zod'

export async function verifyCaptcha(event: H3Event, token: string | undefined, security: ModuleOptions['security']) {
  if (!security?.captcha?.enabled) {
    return
  }

  const validation = captchaVerificationSchema.safeParse({
    ...security.captcha,
    token,
  })

  if (!validation.success) {
    throw createError({ statusCode: 400, message: z.prettifyError(validation.error) })
  }

  const { provider, secretKey, token: validToken } = validation.data
  let verifyUrl = ''

  switch (provider) {
    case 'turnstile':
      verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
      break
    case 'recaptcha':
      verifyUrl = 'https://www.google.com/recaptcha/api/siteverify'
      break
    case 'hcaptcha':
      verifyUrl = 'https://api.hcaptcha.com/siteverify'
      break
  }

  if (verifyUrl) {
    const verifyResult = await $fetch<{ success: boolean }>(verifyUrl, {
      method: 'POST',
      body: {
        secret: secretKey,
        response: validToken,
        remoteip: getRequestIP(event),
      },
    })

    if (!verifyResult.success) {
      throw createError({ statusCode: 400, message: 'Invalid captcha' })
    }
  }
}
