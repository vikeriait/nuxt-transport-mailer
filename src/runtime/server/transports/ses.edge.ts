import { AwsClient } from 'aws4fetch'
import type { ModuleOptions } from '../../../types'
import type SESTransport from 'nodemailer/lib/ses-transport'
import { defu } from 'defu'
import type { SendEmailRequest, Body } from '@aws-sdk/client-sesv2'
import { normalizeAddressArray } from '../../../runtime/server/utils/mail'
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
export const sendSesEdge = async (sesConfig: ModuleOptions['ses'], options: SESTransport.MailOptions): Promise<SentMessageInfo> => {
  // @ts-expect-error - Accessing potential credential properties that might exist on the union type
  const accessKeyId = sesConfig?.clientConfig?.accessKeyId || sesConfig?.clientConfig?.credentials?.accessKeyId
  // @ts-expect-error - Accessing potential credential properties that might exist on the union type
  const secretAccessKey = sesConfig?.clientConfig?.secretAccessKey || sesConfig?.clientConfig?.credentials?.secretAccessKey
  // @ts-expect-error - Accessing potential credential properties that might exist on the union type
  const sessionToken = sesConfig?.clientConfig?.sessionToken || sesConfig?.clientConfig?.credentials?.sessionToken
  const region = sesConfig?.clientConfig?.region

  const validClientConfig = {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region,
    service: 'email',
    ...sesConfig?.clientConfig,
  }

  const client = new AwsClient(validClientConfig as ConstructorParameters<typeof AwsClient>[0])

  const to = options.to ? normalizeAddressArray(options.to) : undefined
  const cc = options.cc ? normalizeAddressArray(options.cc) : undefined
  const bcc = options.bcc ? normalizeAddressArray(options.bcc) : undefined
  const replyTo = options.replyTo ? normalizeAddressArray(options.replyTo) : undefined

  const body: Body = {}
  if (options.text) {
    body.Text = {
      Data: options.text as string,
    }
  }
  if (options.html) {
    body.Html = {
      Data: options.html as string,
    }
  }

  let input: SendEmailRequest = {
    FromEmailAddress: options.from as string,
    Destination: {
      ToAddresses: to,
      CcAddresses: cc,
      BccAddresses: bcc,
    },
    ReplyToAddresses: replyTo,
    Content: {
      Simple: {
        Subject: {
          Data: options.subject,
        },
        Body: body,
      },
    },
  }

  input = defu(
    input,
    options.ses,
    sesConfig?.commandInput ?? {},
  )

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

  return {
    messageId: data.MessageId,
    envelope: {
      from: options.from as string,
      to: [...(to || []), ...(cc || []), ...(bcc || [])],
    },
    accepted: [...(to || []), ...(cc || []), ...(bcc || [])],
    rejected: [],
    pending: [],
    response: JSON.stringify(data),
  }
}
