import { GoogleGenAI } from '@google/genai'
import OpenAI from 'openai'
import type { ParsedNote } from './types.js'

// AI Provider types
type AIProvider = 'gemini' | 'openai'

// Lazy-loaded clients
let geminiClient: GoogleGenAI | null = null
let openaiClient: OpenAI | null = null

const getProvider = (): AIProvider => {
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.OPENAI_API_KEY) return 'openai'
  return 'gemini' // default
}

const getGemini = (): GoogleGenAI => {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    })
  }
  return geminiClient
}

const getOpenAI = (): OpenAI => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    })
  }
  return openaiClient
}

const getModel = (): string => {
  const provider = getProvider()
  if (process.env.AI_MODEL) return process.env.AI_MODEL
  return provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'
}

const TIME_ZONE = process.env.APP_TIMEZONE || 'Europe/Paris'

const formatISODateInTimeZone = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)

  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  if (!year || !month || !day) {
    throw new Error('Failed to format date')
  }
  return `${year}-${month}-${day}`
}

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const WEEKDAYS: Record<string, number> = {
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
}

const MONTHS: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
}

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const padNumber = (value: number): string => value.toString().padStart(2, '0')

const getNextWeekday = (reference: Date, targetDay: number): Date => {
  const currentDay = reference.getDay()
  const diff = (targetDay + 7 - currentDay) % 7 || 7
  return addDays(reference, diff)
}

const buildISOFromDate = (date: Date): string => formatISODateInTimeZone(date, TIME_ZONE)

const parseExplicitDate = (text: string, reference: Date): string | null => {
  const normalized = normalizeText(text)

  const dayMonthMatch = normalized.match(
    new RegExp(`\\b(\\d{1,2})\\s*(${Object.keys(MONTHS).join('|')})\\b`)
  )
  if (dayMonthMatch) {
    const day = Number(dayMonthMatch[1])
    const month = MONTHS[dayMonthMatch[2]] ?? 0
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      let candidate = new Date(reference.getFullYear(), month - 1, day)
      const referenceDate = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate())
      if (candidate.getTime() <= referenceDate.getTime()) {
        candidate.setFullYear(candidate.getFullYear() + 1)
      }
      return buildISOFromDate(candidate)
    }
  }

  const slashMatch = normalized.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/)
  if (slashMatch) {
    const day = Number(slashMatch[1])
    const month = Number(slashMatch[2])
    let year = slashMatch[3] ? Number(slashMatch[3]) : reference.getFullYear()
    if (year < 100) {
      year += 2000
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      let candidate = new Date(year, month - 1, day)
      const referenceDate = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate())
      if (candidate.getTime() <= referenceDate.getTime()) {
        candidate.setFullYear(candidate.getFullYear() + 1)
      }
      return buildISOFromDate(candidate)
    }
  }

  return null
}

const parseWeekdayFromText = (text: string, reference: Date): string | null => {
  const normalized = normalizeText(text)

  for (const [name, value] of Object.entries(WEEKDAYS)) {
    const regex = new RegExp(`\\b(${name})(?:\\s+prochain)?\\b`)
    if (regex.test(normalized)) {
      const date = getNextWeekday(reference, value)
      return buildISOFromDate(date)
    }
  }

  return null
}

const parseTimeFromText = (text: string): string | null => {
  const normalized = normalizeText(text)

  const explicitMatch = normalized.match(/\b(\d{1,2})(?:h|:)?(\d{2})?\b/)
  if (explicitMatch) {
    let hour = Number(explicitMatch[1])
    let minute = explicitMatch[2] ? Number(explicitMatch[2]) : 0
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      if (normalized.includes('pm') && hour < 12) {
        hour += 12
      }
      return `${padNumber(hour)}:${padNumber(minute)}`
    }
  }

  if (normalized.includes('matin')) return '09:00'
  if (normalized.includes('apres-midi') || normalized.includes('apres midi') || normalized.includes('apresmidi')) return '14:00'
  if (normalized.includes('soir')) return '19:00'
  if (normalized.includes('midi')) return '12:00'

  return null
}

const parseDateFromText = (text: string, reference: Date): string | null => {
  const normalized = normalizeText(text)

  if (normalized.includes('apres-demain') || normalized.includes('apres demain')) {
    return buildISOFromDate(addDays(reference, 2))
  }

  if (normalized.includes('demain') && !normalized.includes('apres-demain') && !normalized.includes('apres demain')) {
    return buildISOFromDate(addDays(reference, 1))
  }

  const inDaysMatch = normalized.match(/dans\s+(\d{1,2})\s+jours?/)
  if (inDaysMatch) {
    const days = Number(inDaysMatch[1])
    return buildISOFromDate(addDays(reference, days))
  }

  const weekendMatch =
    normalized.includes('weekend') || normalized.includes('week-end') || normalized.includes('week end')
  if (weekendMatch) {
    const saturday = getNextWeekday(reference, WEEKDAYS['samedi'])
    return buildISOFromDate(saturday)
  }

  const explicitDate = parseExplicitDate(text, reference)
  if (explicitDate) {
    return explicitDate
  }

  const weekdayDate = parseWeekdayFromText(text, reference)
  if (weekdayDate) {
    return weekdayDate
  }

  return null
}

const buildHeuristicTitle = (text: string): string => {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const candidate = words.slice(0, 6).join(' ')
  if (!candidate) return 'Nouvelle tâche'
  return candidate.charAt(0).toUpperCase() + candidate.slice(1)
}

const buildHeuristicNote = (text: string): string => {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return 'Intention : tâche sans description'

  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean)
  let summary = sentences.slice(0, 2).join(' ').trim()
  if (!summary) summary = normalized
  if (!summary.endsWith('.')) summary = `${summary}.`
  if (summary.length > 150) {
    summary = `${summary.slice(0, 147).trim()}...`
  }

  return `Intention : ${summary}`
}

const buildHeuristicParsedNote = (text: string): Omit<ParsedNote, 'ai_used' | 'ai_provider'> => {
  const now = new Date()
  return {
    title: buildHeuristicTitle(text),
    note: buildHeuristicNote(text),
    date: parseDateFromText(text, now),
    time: parseTimeFromText(text) ?? '09:00'
  }
}

const buildPrompt = (userText: string): string => {
  const now = new Date()
  const today = formatISODateInTimeZone(now, TIME_ZONE)
  const dayOfWeek = now.toLocaleDateString('fr-FR', { weekday: 'long', timeZone: TIME_ZONE })
  
  // Calculate some useful reference dates
  const tomorrowStr = formatISODateInTimeZone(addDays(now, 1), TIME_ZONE)
  
  // Get next Monday
  const nextMonday = new Date(now)
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)
  const nextMondayStr = formatISODateInTimeZone(nextMonday, TIME_ZONE)
  
  return `Tu es un assistant qui transforme des notes vocales en français en tâches structurées.

CONTEXTE TEMPOREL:
- Timezone: ${TIME_ZONE}
- Aujourd'hui: ${dayOfWeek} ${today}
- Demain: ${tomorrowStr}
- Lundi prochain: ${nextMondayStr}

Tu DOIS retourner un objet JSON strict:
{
  "title": "...",
  "note": "...",
  "date": "YYYY-MM-DD" | null,
  "time": "HH:MM"
}

RÈGLES IMPORTANTES:
1. DATES - Convertir les expressions relatives en dates absolues YYYY-MM-DD:
   - "aujourd'hui" → ${today}
   - "demain" → ${tomorrowStr}
   - "lundi/mardi/mercredi/jeudi/vendredi/samedi/dimanche" → calculer la date du PROCHAIN jour de la semaine
   - "lundi prochain", "mardi prochain" → le prochain jour de ce nom
   - Dates explicites en français (sans année) → déduire l'année:
     - Ex: "mercredi 18 janvier" / "18 janvier" / "18/01" / "18-01"
     - Si la date (jour+mois) est déjà passée par rapport à ${today}, utiliser l'année suivante, sinon l'année en cours
   - "dans X jours" → ajouter X jours à aujourd'hui
   - "la semaine prochaine" → lundi prochain ${nextMondayStr}
   - "ce weekend" → samedi prochain
   - Si AUCUNE date n'est mentionnée → null

2. HEURES - Format HH:MM (24h):
   - "à 14h", "à 14h30" → "14:00", "14:30"
   - "ce matin" → "09:00"
   - "cet après-midi" → "14:00"
   - "ce soir" → "19:00"
   - Si aucune heure → "09:00"

3. TITRE: 3-6 mots maximum, clair et actionnable, en français
4. NOTE: Résumé synthétique (1-2 phrases) du besoin, en français. Laisse de côté la transcription brute, concentre-toi sur l'intention + les éléments à prendre en compte (contexte, priorité, obstacles). Ne fais PAS un copier-coller du texte original.

Retourne UNIQUEMENT le JSON. Pas d'explication, pas de markdown.

Entrée utilisateur: ${userText}`
}

const parseWithGemini = async (text: string): Promise<ParsedNote> => {
  const ai = getGemini()
  const model = getModel()
  
  const response = await ai.models.generateContent({
    model,
    contents: buildPrompt(text)
  })

  const content = response.text?.trim()
  
  if (!content) {
    throw new Error('Empty response from Gemini')
  }

  // Clean the response (remove potential markdown code blocks)
  let jsonString = content
  if (content.startsWith('```')) {
    jsonString = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
  }

  return JSON.parse(jsonString) as ParsedNote
}

const parseWithOpenAI = async (text: string): Promise<ParsedNote> => {
  const client = getOpenAI()
  const model = getModel()
  
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'user', content: buildPrompt(text) }
    ],
    temperature: 0.1,
    max_tokens: 200
  })

  const content = response.choices[0]?.message?.content?.trim()
  
  if (!content) {
    throw new Error('Empty response from OpenAI')
  }

  // Clean the response (remove potential markdown code blocks)
  let jsonString = content
  if (content.startsWith('```')) {
    jsonString = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
  }

  return JSON.parse(jsonString) as ParsedNote
}

export const parseNote = async (text: string): Promise<ParsedNote> => {
  const provider = getProvider()
  const heuristics = buildHeuristicParsedNote(text)
  
  // Check if any API key is configured
  const hasGeminiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_api_key_here'
  const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_api_key_here'
  
  if (!hasGeminiKey && !hasOpenAIKey) {
    console.warn('No AI API key configured, using fallback parsing')
    return {
      ...heuristics,
      ai_used: false,
      ai_provider: 'fallback'
    }
  }

  try {
    let parsed: ParsedNote
    
    if (provider === 'gemini') {
      console.log('Using Gemini AI')
      parsed = await parseWithGemini(text)
    } else {
      console.log('Using OpenAI')
      parsed = await parseWithOpenAI(text)
    }

    // Validate the structure
    if (!parsed.title || !parsed.note) {
      throw new Error('Invalid response structure')
    }

    return {
      title: parsed.title || heuristics.title,
      note: parsed.note || heuristics.note,
      date: parsed.date ?? heuristics.date,
      time: parsed.time ?? heuristics.time ?? '09:00',
      ai_used: true,
      ai_provider: provider
    } as ParsedNote

  } catch (error) {
    console.error('AI parsing error:', error)
    return {
      ...heuristics,
      ai_used: false,
      ai_provider: 'fallback'
    }
  }
}
