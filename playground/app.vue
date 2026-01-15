<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMailer } from '../src/runtime/composables/useMailer'

const { send, pending, error, data } = useMailer()

const form = ref({
  to: 'test@example.com',
  subject: 'Test Email from Nuxt Transport Mailer',
  text: 'Hello! This is a test email sent from the playground.',
})

const status = computed(() => {
  if (pending.value) return 'sending'
  if (error.value) return 'error'
  if (data.value) return 'success'
  return 'idle'
})

const responseMessage = computed(() => {
  if (status.value === 'error')
    return error.value?.message || error.value?.statusMessage || 'Failed to send email.'
  if (status.value === 'success')
    return 'Email sent successfully! Check your inbox (or trap).'
  return ''
})

async function submit() {
  await send(form.value)
}
</script>

<template>
  <div class="container">
    <div class="card">
      <h1>✉️ Nuxt Transport Mailer</h1>
      <p class="subtitle">
        Playground to test your email configuration
      </p>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label for="to">To:</label>
          <input
            id="to"
            v-model="form.to"
          >
        </div>

        <div class="form-group">
          <label for="subject">Subject:</label>
          <input
            id="subject"
            v-model="form.subject"
            type="text"
            placeholder="Email Subject"
            required
          >
        </div>

        <div class="form-group">
          <label for="message">Message (Text):</label>
          <textarea
            id="message"
            v-model="form.text"
            rows="4"
            placeholder="Type your message here..."
          />
        </div>

        <button
          type="submit"
          :disabled="pending"
          :class="status"
        >
          {{ pending ? 'Sending...' : 'Send Email' }}
        </button>
      </form>

      <div
        v-if="status === 'success' || status === 'error'"
        class="feedback"
        :class="status"
      >
        {{ responseMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reset & Base */
.container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f3f4f6;
  color: #1f2937;
  padding: 20px;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 480px;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #6b7280;
  margin-top: 0.5rem;
  margin-bottom: 2rem;
}

/* Form Elements */
.form-group {
  margin-bottom: 1.25rem;
}

label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}

input, textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box; /* Important for padding */
  transition: border-color 0.15s ease;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Button */
button {
  width: 100%;
  padding: 0.75rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #2563eb;
}

button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* Feedback */
.feedback {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
}

.feedback.success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.feedback.error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
</style>
