import type { TranscriptionResult, SupportedLanguage } from './types'

/**
 * Транскрибує аудіофайл через OpenAI Whisper API.
 *
 * @param audioUrl — прямий URL до аудіофайлу (наприклад, тимчасовий URL від Meta)
 * @returns TranscriptionResult
 */
export async function transcribeAudio(audioUrl: string): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      text: '[Аудіо-транскрипція недоступна — додайте OPENAI_API_KEY]',
      language: null,
      durationSeconds: 0,
    }
  }

  try {
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error(
        `Не вдалося завантажити аудіо: ${audioResponse.status} ${audioResponse.statusText}`
      )
    }

    const audioBlob = await audioResponse.blob()

    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.ogg')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'verbose_json')

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text()
      throw new Error(`Whisper API error: ${whisperResponse.status} ${errorText}`)
    }

    const data = (await whisperResponse.json()) as {
      text: string
      language?: string
      duration?: number
    }

    const langMap: Record<string, SupportedLanguage> = {
      german: 'de',
      russian: 'ru',
      ukrainian: 'ua',
      english: 'en',
    }

    const detectedLang = data.language ? langMap[data.language.toLowerCase()] ?? null : null

    return {
      text: data.text,
      language: detectedLang,
      durationSeconds: typeof data.duration === 'number' ? data.duration : 0,
    }
  } catch (error) {
    console.error('[AI Transcribe] Помилка транскрипції:', error)
    return {
      text: '[Помилка транскрипції аудіо]',
      language: null,
      durationSeconds: 0,
    }
  }
}
