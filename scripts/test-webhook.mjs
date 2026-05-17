#!/usr/bin/env node

const WEBHOOK_URL = 'https://couchhelp.click/api/webhooks/test'

const payload = {
  object: 'whatsapp_business_account',
  entry: [{
    id: '1701991357664994',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: '49123456789',
          phone_number_id: '1187222634465513',
        },
        contacts: [{
          profile: { name: 'Вася Пупкін' },
          wa_id: '491234567895',
        }],
        messages: [{
          from: '491234567895',
          id: `wamid.script_${Date.now()}`,
          timestamp: String(Math.floor(Date.now() / 1000)),
          type: 'text',
          text: { body: 'Хелло. Я хотів би знать, как получить коучінг.' },
        }],
      },
      field: 'messages',
    }],
  }],
}

async function main() {
  console.log('[Test Webhook] Sending...')
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  })
  console.log(`Status: ${res.status}`)
  console.log(`Response: ${await res.text()}`)
}

main()