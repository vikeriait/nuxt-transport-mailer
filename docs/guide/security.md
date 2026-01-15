# Security

## Captcha Protection

The module supports popular Captcha providers to prevent bot spam.

Supported providers:
- Cloudflare Turnstile
- Google reCAPTCHA
- hCaptcha

To enable:
1. Set `security.captcha.enabled` to `true`.
2. Configure `provider` and `secretKey`.
3. In your frontend, obtain the token and pass it as `captchaToken` in the `send` options.

## Rate Limiting

We integrate with [nuxt-security](https://nuxt-security.vercel.app/) to provide rate limiting for the API endpoint.

::: warning Requirement
You must have `nuxt-security` installed and enabled globally in your project for this feature to work.
:::

By default, when `serverApi.enabled` is `true`, a strict rate limit is applied to prevent abuse:
- **Requests**: 2 tokens
- **Interval**: 3,000,000 ms (~50 minutes)

You can customize or override these values by configuring `security.rateLimiter` in the module options.

## Honeypot

A hidden field `_gotcha` is supported. If this field is present in the request body, the server will pretend to send the email (returning success) but will silently discard it.
