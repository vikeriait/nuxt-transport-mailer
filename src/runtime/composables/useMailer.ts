import { type Ref, ref } from 'vue'
import { useRuntimeConfig } from '#app'
import type { EmailOptions, ModuleOptions } from '../../types'
import type { FetchError } from 'ofetch'
import type { EmailBody } from '../../../src/runtime/server/utils/schemas'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import type SESTransport from 'nodemailer/lib/ses-transport'

/**
 * Client-side composable for sending emails via the configured server API endpoint.
 *
 * This composable exposes a `send` method and reactive state for handling the request lifecycle
 * (pending, error, data).
 *
 * @returns An object containing:
 * - `send`: Function to trigger the email sending.
 * - `data`: The response from the server upon success (e.g., message ID).
 * - `pending`: Boolean indicating if the request is currently in progress.
 * - `error`: Any error that occurred during the request.
 */
export function useMailer() {
  const config = useRuntimeConfig().public.transportMailer as ModuleOptions
  const apiRoute = config.serverApi?.route || '/api/mail/send'

  const data: Ref<SMTPTransport.SentMessageInfo | SESTransport.SentMessageInfo | undefined> = ref(undefined)
  const pending: Ref<boolean> = ref(false)
  const error: Ref<FetchError | null> = ref(null)

  /**
   * Sends an email by making a POST request to the server API.
   *
   * @param mail - The email content options (recipient, subject, body, etc.).
   */
  async function send(mail: EmailBody | EmailOptions) {
    pending.value = true
    error.value = null

    try {
      data.value = await $fetch(apiRoute, {
        method: 'POST',
        body: mail,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
    catch (e) {
      error.value = (e as FetchError).data
    }
    finally {
      pending.value = false
    }
  }

  return {
    send,
    data,
    pending,
    error,
  }
}
