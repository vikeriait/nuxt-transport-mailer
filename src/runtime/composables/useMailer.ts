import { type Ref, ref } from 'vue'
import { useRuntimeConfig } from '#app'
import type { EmailOptions, ModuleOptions } from '../../types'
import type { FetchError } from 'ofetch'
import type { EmailBody } from '../../../src/runtime/server/utils/schemas'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import type SESTransport from 'nodemailer/lib/ses-transport'

/**
 * Composable for sending emails via the server API endpoint.
 *
 * @returns An object with the `send` function, and refs for `data`, `pending`, and `error`.
 */
export function useMailer() {
  const config = useRuntimeConfig().public.transportMailer as ModuleOptions
  const apiRoute = config.serverApi?.route || '/api/mail/send'

  const data: Ref<SMTPTransport.SentMessageInfo | SESTransport.SentMessageInfo | undefined> = ref(undefined)
  const pending: Ref<boolean> = ref(false)
  const error: Ref<FetchError | null> = ref(null)

  /**
   * Sends an email.
   * @param mail - An object containing the mail details (to, subject, text, etc.).
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
