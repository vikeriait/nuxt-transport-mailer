import { z } from 'zod'

const baseEmailSchema = z.object({
  to: z.union([z.string(), z.array(z.string())]).optional(),
  cc: z.union([z.string(), z.array(z.string())]).optional(),
  bcc: z.union([z.string(), z.array(z.string())]).optional(),

  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  from: z.string().optional(),
  replyTo: z.string().optional(),

  _gotcha: z.string().optional(),
  captchaToken: z.string().optional(),
}).superRefine((val, ctx) => {
  if (!val.to && !val.cc && !val.bcc) {
    ctx.addIssue({
      code: 'custom',
      message: 'At least one recipient (to, cc, or bcc) must be provided',
    })
  }
})

/**
 * Zod schema for validating the body of an email request.
 * Requires at least one recipient (to, cc, or bcc).
 *
 * NOTE: captchaToken is marked as optional here because its requirement is determined
 * by the module's runtime configuration. The actual enforcement is handled by the
 * `verifyCaptcha` utility function.
 */
export const emailBodySchema = baseEmailSchema

/**
 * Zod schema for validating the full email configuration, including the sender address.
 */
export const emailConfigurationSchema = baseEmailSchema.safeExtend({
  from: z.string(),
})

/**
 * Inferred type from `emailBodySchema`.
 */
export type EmailBody = z.infer<typeof emailBodySchema>

/**
 * Inferred type from `emailConfigurationSchema`.
 */
export type EmailConfiguration = z.infer<typeof emailConfigurationSchema>

/**
 * Zod schema for validating captcha verification requests.
 */
export const captchaVerificationSchema = z.object({
  token: z.string('Captcha token is required').min(1, 'Captcha token is required'),
  provider: z.enum(['turnstile', 'recaptcha', 'hcaptcha'], 'Captcha provider not valid'),
  secretKey: z.string('Captcha secretKey is required').min(1, 'Captcha secretKey is required'),
})

/**
 * Inferred type from `captchaVerificationSchema`.
 */
export type CaptchaVerification = z.infer<typeof captchaVerificationSchema>
