# Cloudflare Worker

For sites deployed as static assets on Cloudflare, the mail endpoint can run in a plain Worker instead of the Nitro server. Initializing Nuxt on every request costs CPU time that can exceed the 10 ms limit of the Workers Free plan; the Worker handler runs without Nitro.

The client side does not change: `useMailer` calls the same route with the same body and gets the same response.

## Setup

Import the handler from the `/worker` entry and call it from your Worker `fetch`:

```ts [worker/index.ts]
import { createMailHandler } from '@vikeriait/nuxt-transport-mailer/worker'

interface Env {
  CONTACT_EMAIL: string
  MAIL_FROM: string
  SES_ACCESS_KEY_ID: string
  SES_SECRET_ACCESS_KEY: string
  TURNSTILE_SECRET_KEY: string
  MAIL_RATE_LIMITER: RateLimit
}

const mail = createMailHandler((env: Env) => ({
  to: env.CONTACT_EMAIL,
  from: env.MAIL_FROM,
  driver: 'ses',
  ses: {
    clientConfig: {
      accessKeyId: env.SES_ACCESS_KEY_ID,
      secretAccessKey: env.SES_SECRET_ACCESS_KEY,
      region: 'eu-west-1',
    },
  },
  captcha: {
    provider: 'turnstile',
    secretKey: env.TURNSTILE_SECRET_KEY,
  },
  rateLimiter: env.MAIL_RATE_LIMITER,
}))

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return await mail(request, env, ctx) ?? new Response('Not Found', { status: 404 })
  },
} satisfies ExportedHandler<Env>
```

The handler returns `undefined` for requests outside its route, so several handlers can be chained in the same `fetch`.

With static assets, route only the API to the Worker:

```jsonc [wrangler.jsonc]
{
  "main": "worker/index.ts",
  "assets": {
    "directory": ".output/public",
    "run_worker_first": ["/api/*"]
  },
  "ratelimits": [
    { "name": "MAIL_RATE_LIMITER", "namespace_id": "1001", "simple": { "limit": 5, "period": 60 } }
  ]
}
```

Keep `serverApi.enabled: false` in `nuxt.config.ts`: the endpoint is served by the Worker.

## Differences from the Nuxt server API

| | Nuxt server API | Worker handler |
|---|---|---|
| Recipients and sender | From the request body, `defaults.from` as fallback | Fixed in the configuration; `to`, `from`, `cc`, `bcc` in the body are ignored |
| Accepted body fields | All email options | `subject`, `text`, `html`, `replyTo`, `captchaToken`, `_gotcha` |
| Drivers | `smtp`, `ses`, `stream` | `ses`, `smtp` (Edge transports only) |
| Rate limiting | `nuxt-security` | Workers `ratelimits` binding, keyed by `cf-connecting-ip` |
| Success result | Full `SentMessageInfo` | `{ messageId }` only |
| Transport failure | `500` with the transport message | `502 Failed to send email`; the detail goes to the Worker logs |
| Hooks | `transport:send:before`, `transport:send:after` | `onSent` |

::: warning SMTP
SMTP on Edge uses `worker-mailer`, which relies on Cloudflare's `connect()` API. Measure the CPU time on your plan before relying on it.
:::

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `route` | `string` | `'/api/mail/send'` | Path served by the handler. |
| `to` | `string \| string[]` | — | Fixed recipients. |
| `from` | `string` | — | Fixed sender. |
| `driver` | `'ses' \| 'smtp'` | — | Transport. |
| `ses` | `{ endpoint?, clientConfig }` | — | `aws4fetch` client configuration. Required with `driver: 'ses'`. |
| `smtp` | `WorkerMailerOptions` | — | `worker-mailer` options. Required with `driver: 'smtp'`. |
| `captcha` | `{ provider, secretKey }` | — | `turnstile`, `recaptcha` or `hcaptcha`. Omit to disable. |
| `rateLimiter` | `{ limit({ key }) }` | — | Workers rate limiting binding. Omit to disable. |
| `maxBodyLength` | `number` | `65536` | Maximum length of the raw body, in characters (`413` above it). |
| `maxSubjectLength` | `number` | `200` | Maximum length of the subject. |
| `onSent` | `({ messageId, request, body }) => void \| Promise<void>` | — | Runs after a successful send, before the response. Errors are logged and do not fail the response. |
