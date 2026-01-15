# Usage

## Client-Side

Use the `useMailer` composable to send emails from your Vue components/pages.

```vue
<script setup lang="ts">
const { send, pending, error } = useMailer()

async function onSend() {
  await send({
    to: 'user@example.com',
    subject: 'Hello',
    text: 'This is a test email.'
  })

  if (error.value) {
    console.error('Failed to send:', error.value)
  } else {
    console.log('Sent!')
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
