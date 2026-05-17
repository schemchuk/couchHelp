#!/usr/bin/env node
/**
 * Скрипт для тестування webhook з кирилицею.
 * Відправляє POST на /api/webhooks/test з реалістичним payload.
 *
 * Використання: node scripts/test-webhook.mjs
 */

const WEBHOOK_URL = 'https://couchhelp.click/api/webhooks/test'

const payload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '1701991357664994',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '49123456789',
              phone_number_id: '1187222634465513',
            },
            contacts: [
              {
                profile: { name: 'Александра Новикова' },
                wa_id: '491234567895',
              },
            ],
            messages: [
              {
                from: '491234567895',
                id: `wamid.script_${Date.now()}`,
                timestamp: String(Math.floor(Date.now() / 1000)),
                type: 'text',
                text: {
                  body: 'Здравствуйте! Меня интересует программа AVGS. Когда можно созвониться?',
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
}

async function main() {
  console.log('[Test Webhook] Sending payload...')
  console.log('[Test Webhook] wamid:', payload.entry[0].changes[0].value.messages[0].id)

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })

    const body = await res.text()
    console.log(`[Test Webhook] Status: ${res.status}`)
    console.log(`[Test Webhook] Response: ${body}`)
  } catch (err) {
    console.error('[Test Webhook] Error:', err.message)
    process.exit(1)
  }
}

main()
