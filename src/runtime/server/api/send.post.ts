import type { H3Error } from 'h3'
import { z } from 'zod'
import { useRuntimeConfig } from '#imports'
import { sendMail } from '../utils/mail'
import type { ModuleOptions } from '../../../types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().transportMailer as ModuleOptions
  const security = config.security

  try {
    const body = await readBody(event)

    // Honeypot check
    if (body?._gotcha) {
      return { success: true, message: 'Sent' }
    }

    const result = await sendMail(body)

    return { success: true, result }
  }
  catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation Error',
        data: error.issues,
      })
    }

    // If it's already an H3Error (has statusCode), rethrow it to preserve data/structure
    const h3Error = error as H3Error
    if (h3Error.statusCode) {
      throw error
    }

    // Wrap generic internal errors (e.g. SMTP connection failed)
    const err = error as Error
    throw createError({
      statusCode: 500,
      message: err.message || 'Failed to send email',
    })
  }
})
