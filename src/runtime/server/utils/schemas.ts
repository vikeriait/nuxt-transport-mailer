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

export const emailBodySchema = baseEmailSchema

export const emailConfigurationSchema = baseEmailSchema.safeExtend({
  from: z.string(),
})

export type EmailBody = z.infer<typeof emailBodySchema>
export type EmailConfiguration = z.infer<typeof emailConfigurationSchema>
