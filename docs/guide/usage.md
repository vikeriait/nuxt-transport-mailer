# Usage

## Client-Side

Use the `useMailer` composable to send emails from your Vue components/pages. This composable interacts with the server-side API endpoint (`/api/mail/send` by default).

### `useMailer()`

Returns a reactive object with the following properties:

- **`send(mail: EmailOptions)`**: Function to trigger the email sending.
- **`pending`**: `Ref<boolean>` indicating if the request is currently in progress.
- **`data`**: `Ref<any>` containing the response from the server upon success.
- **`error`**: `Ref<FetchError | null>` containing any error that occurred during the request.

```vue
<script setup lang="ts">
const { send, pending, error, data } = useMailer()

async function onSend() {
  await send({
    to: 'user@example.com',
    subject: 'Hello',
    text: 'This is a test email.'
  })

  if (error.value) {
    console.error('Failed to send:', error.value)
  } else {
    console.log('Sent!', data.value)
  }
}
</script>
```

## Server-Side

Use `sendMail` utility within your API handlers.

```typescript
import { sendMail } from '#imports'

export default defineEventHandler(async (event) => {
  await sendMail({
    to: 'admin@example.com',
    subject: 'Notification',
    text: 'Something happened.'
  })
})
```

## Hooks (Nitro)

The module provides Nitro hooks that allow you to intercept the email sending process. This is useful for logging, modifying options before sending, or performing actions after an email is sent.

### Available Hooks

| Hook | Arguments | Description |
| :--- | :--- | :--- |
| `transport:send:before` | `(options: EmailOptions)` | Called before the email is sent. You can modify the `options` object. |
| `transport:send:after` | `(result: SentMessageInfo)` | Called after the email has been successfully sent. |

### Example Usage

Create a Nitro plugin in `server/plugins/mailer.ts`:

```typescript
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('transport:send:before', (options) => {
    console.log('Preparing to send email to:', options.to)
    // You could inject global headers or perform logging here
  })

  nitroApp.hooks.hook('transport:send:after', (result) => {
    console.log('Email sent successfully! Message ID:', result.messageId)
  })
})
```
