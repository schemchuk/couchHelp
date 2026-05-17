#!/usr/bin/env node
/**
 * Скрипт для тестування webhook з українською кирилицею.
 * Відправляє POST на /api/webhooks/test з payload від Оксани Петренко.
 *
 * Використання: node scripts/test-webhook-ua.mjs
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
              display_phone_number: '4917612345002',
              phone_number_id: '1187222634465513',
            },
            contacts: [
              {
                profile: { name: 'Оксана Петренко' },
                wa_id: '4917612345002',
              },
            ],
            messages: [
              {
                from: '4917612345002',
                id: `wamid.oksana_${Date.now()}`,
                timestamp: String(Math.floor(Date.now() / 1000)),
                type: 'text',
                text: {
                  body: 'Доброго дня! Цікавлюсь програмою AVGS для відкриття власного бізнесу. Я отримую Bürgergeld. Як можна записатися на консультацію?',
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
  console.log('[Test Webhook UA] Sending payload...')
  console.log('[Test Webhook UA] wamid:', payload.entry[0].changes[0].value.messages[0].id)

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })

    const body = await res.text()
    console.log(`[Test Webhook UA] Status: ${res.status}`)
    console.log(`[Test Webhook UA] Response: ${body}`)
  } catch (err) {
    console.error('[Test Webhook UA] Error:', err.message)
    process.exit(1)
  }
}

main()
