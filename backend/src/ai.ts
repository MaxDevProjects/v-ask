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

const buildPrompt = (userText: string): string => {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const dayOfWeek = now.toLocaleDateString('fr-FR', { weekday: 'long' })
  
  // Calculate some useful reference dates
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  
  // Get next Monday
  const nextMonday = new Date(now)
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)
  const nextMondayStr = nextMonday.toISOString().split('T')[0]
  
  return `Tu es un assistant qui transforme des notes vocales en français en tâches structurées.

CONTEXTE TEMPOREL:
- Aujourd'hui: ${dayOfWeek} ${today}
- Demain: ${tomorrowStr}
- Lundi prochain: ${nextMondayStr}

Tu DOIS retourner un objet JSON strict:
{
  "title": "...",
  "note": "...",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}

RÈGLES IMPORTANTES:
1. DATES - Convertir les expressions relatives en dates absolues YYYY-MM-DD:
   - "aujourd'hui" → ${today}
   - "demain" → ${tomorrowStr}
   - "lundi/mardi/mercredi/jeudi/vendredi/samedi/dimanche" → calculer la date du PROCHAIN jour de la semaine
   - "lundi prochain", "mardi prochain" → le prochain jour de ce nom
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
4. NOTE: Le texte original de l'utilisateur

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

const fallbackParse = (text: string): ParsedNote => {
  return {
    title: text.slice(0, 50).split(' ').slice(0, 5).join(' '),
    note: text,
    date: new Date().toISOString().split('T')[0],
    time: '09:00'
  }
}

export const parseNote = async (text: string): Promise<ParsedNote> => {
  const provider = getProvider()
  
  // Check if any API key is configured
  const hasGeminiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_api_key_here'
  const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_api_key_here'
  
  if (!hasGeminiKey && !hasOpenAIKey) {
    console.warn('No AI API key configured, using fallback parsing')
    return fallbackParse(text)
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
      title: parsed.title,
      note: parsed.note,
      date: parsed.date || null,
      time: parsed.time || '09:00'
    } as ParsedNote

  } catch (error) {
    console.error('AI parsing error:', error)
    return fallbackParse(text)
  }
}
