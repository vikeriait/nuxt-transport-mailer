import { type Ref, ref } from 'vue'
import { useRuntimeConfig } from '#app'
import type { ModuleOptions } from '../../types'
import type { SentMessageInfo } from 'nodemailer'
import type { FetchError } from 'ofetch'
import type Mail from 'nodemailer/lib/mailer'

/**
 * Composable for sending emails via the server API endpoint.
 *
 * @returns An object with the `send` function, and refs for `data`, `pending`, and `error`.
 */
export function useMailer() {
  const config = useRuntimeConfig().public.transportMailer as ModuleOptions
  const apiRoute = config.serverApi?.route || '/api/mail/send'

  const data: Ref<SentMessageInfo> = ref(null)
  const pending: Ref<boolean> = ref(false)
  const error: Ref<FetchError | null> = ref(null)

  /**
   * Sends an email.
   * @param mail - An object containing the mail details (to, subject, text, etc.).
   */
  async function send(mail: Mail.Options) {
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
