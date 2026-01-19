import { AwsClient } from 'aws4fetch'
import type { EmailOptions, ModuleOptions } from '../../../types'
import type { SendEmailRequest } from '@aws-sdk/client-sesv2'
import { toSESMailOptions, getSesClientConfigEdge } from '../utils/compatibility'
import type { SentMessageInfo } from 'nodemailer'

/**
 * Sends an email using Amazon SES via `aws4fetch` for Edge compatibility.
 *
 * This function constructs a raw HTTP request to the SES v2 API, making it suitable
 * for environments like Cloudflare Workers where the standard AWS SDK might be too heavy or incompatible.
 *
 * @param sesConfig - The SES configuration options, including credentials and region.
 * @param options - The email options (recipient, subject, body, etc.).
 * @returns A promise that resolves to the sent message info, including the Message ID.
 * @throws Will throw an error if the SES API request fails.
 */
export const sendSesEdge = async (sesConfig: ModuleOptions['ses'], options: EmailOptions): Promise<SentMessageInfo> => {
  const validClientConfig = getSesClientConfigEdge(sesConfig)

  const client = new AwsClient(validClientConfig)

  const input: SendEmailRequest = toSESMailOptions(options, sesConfig)

  const region = validClientConfig.region

  const response = await client.fetch(
    sesConfig?.endpoint ?? `https://email.${region}.amazonaws.com/v2/email/outbound-emails`,
    {
      body: JSON.stringify(input),
    },
  )

  if (!response.ok) {
    let errorDetails = ''
    try {
      const errorJson = await response.json()
      errorDetails = JSON.stringify(errorJson)
    }
    catch {
      errorDetails = await response.text()
    }
    throw new Error(`${response.status} ${response.statusText}: ${errorDetails}`)
  }

  const data = await response.json() as { MessageId: string }

  const to = input.Destination?.ToAddresses || []
  const cc = input.Destination?.CcAddresses || []
  const bcc = input.Destination?.BccAddresses || []

  return {
    messageId: data.MessageId,
    envelope: {
      from: input.FromEmailAddress!,
      to: [...to, ...cc, ...bcc],
    },
    accepted: [...to, ...cc, ...bcc],
    rejected: [],
    pending: [],
    response: JSON.stringify(data),
  }
}
