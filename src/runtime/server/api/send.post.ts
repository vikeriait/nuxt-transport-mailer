import { defineEventHandler, readBody, createError } from 'h3'
import { sendMail } from '../utils/mail'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body || !body.to) {
    throw createError({
      statusCode: 400,
      message: 'Missing recipient (to) in request body',
    })
  }

  try {
    const result = await sendMail({
      to: body.to,
      subject: body.subject || '',
      text: body.text || '',
      html: body.html || '',
      from: body.from,
    })

    return { success: true, result }
  }
  catch (error: unknown) {
    const err = error as Error
    throw createError({
      statusCode: 500,
      message: err.message || 'Failed to send email',
    })
  }
})
