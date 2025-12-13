import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import validator from 'validator'
import dotenv from 'dotenv'
import * as db from './db.js'
import { parseNote } from './ai.js'
import { 
  authMiddleware, 
  hashPassword, 
  comparePassword, 
  generateToken, 
  setTokenCookie, 
  clearTokenCookie,
  type AuthRequest 
} from './auth.js'
import type { CreateTaskInput, UpdateTaskInput, ParseNoteRequest, RegisterInput, LoginInput } from './types.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// Rate limiting - general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiting - strict for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Trop de tentatives, veuillez réessayer dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
})

app.use(generalLimiter)

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Restrict to trusted origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Restrict allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Restrict allowed headers
}))
app.use(express.json({ limit: '5kb' })) // Reduce body size limit
app.use(cookieParser())

// Input sanitization helper
const sanitizeString = (str: string, maxLength: number = 1000): string => {
  if (typeof str !== 'string') return ''
  return validator.escape(validator.trim(str)).slice(0, maxLength)
}

const isValidEmail = (email: string): boolean => {
  return validator.isEmail(email)
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// ==================== AUTH ROUTES ====================

// Register (with rate limiting)
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const input = req.body as RegisterInput

    if (!input.email || !input.password || !input.name) {
      return res.status(400).json({ error: 'Email, mot de passe et nom sont requis' })
    }

    // Validate email format
    if (!isValidEmail(input.email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' })
    }

    // Validate password
    if (input.password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' })
    }

    if (input.password.length > 128) {
      return res.status(400).json({ error: 'Le mot de passe est trop long' })
    }

    // Validate name length
    if (input.name.length > 100) {
      return res.status(400).json({ error: 'Le nom est trop long (100 caractères max)' })
    }

    // Sanitize name (email is already validated)
    const sanitizedName = sanitizeString(input.name, 100)

    // Check if user exists
    const existingUser = db.getUserByEmail(input.email.toLowerCase())
    if (existingUser) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email' })
    }

    const passwordHash = await hashPassword(input.password)
    const user = db.createUser({ ...input, name: sanitizedName }, passwordHash)
    const token = generateToken(user)

    setTokenCookie(res, token)

    res.status(201).json({ user, token })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Erreur lors de la création du compte' })
  }
})

// Login (with rate limiting)
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const input = req.body as LoginInput

    if (!input.email || !input.password) {
      return res.status(400).json({ error: 'Email et mot de passe sont requis' })
    }

    // Validate email format to prevent unnecessary DB queries
    if (!isValidEmail(input.email)) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    const user = db.getUserByEmail(input.email.toLowerCase())
    if (!user) {
      // Use same error message to prevent user enumeration
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    const validPassword = await comparePassword(input.password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    const userPublic = {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at
    }

    const token = generateToken(userPublic)
    setTokenCookie(res, token)

    res.json({ user: userPublic, token })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Erreur lors de la connexion' })
  }
})

// Logout
app.post('/api/auth/logout', (_req, res) => {
  clearTokenCookie(res)
  res.json({ message: 'Déconnexion réussie' })
})

// Get current user
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res) => {
  res.json({ user: req.user })
})

// ==================== AI ROUTES ====================

// Parse note with AI (protected)
app.post('/api/parse-note', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body as ParseNoteRequest

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' })
    }

    const parsed = await parseNote(text)
    res.json(parsed)
  } catch (error) {
    console.error('Parse error:', error)
    res.status(500).json({ error: 'Failed to parse note' })
  }
})

// ==================== TASK ROUTES (Protected) ====================

// Get all tasks (or filter by date)
app.get('/api/tasks', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const { date } = req.query

    if (date && typeof date === 'string') {
      const tasks = db.getTasksByDate(userId, date)
      return res.json(tasks)
    }

    const tasks = db.getAllTasks(userId)
    res.json(tasks)
  } catch (error) {
    console.error('Get tasks error:', error)
    res.status(500).json({ error: 'Failed to get tasks' })
  }
})

// Create task
app.post('/api/tasks', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const input = req.body as CreateTaskInput

    if (!input.title || !input.note) {
      return res.status(400).json({ error: 'Title and note are required' })
    }

    // Sanitize and validate inputs
    const sanitizedInput: CreateTaskInput = {
      title: sanitizeString(input.title, 200),
      note: sanitizeString(input.note, 5000),
      date: input.date ? sanitizeString(input.date, 10) : null,
      time: input.time ? sanitizeString(input.time, 5) : null,
      status: input.status && ['todo', 'doing', 'done'].includes(input.status) ? input.status : 'todo'
    }

    // Validate date format if provided
    if (sanitizedInput.date && !validator.isDate(sanitizedInput.date)) {
      return res.status(400).json({ error: 'Invalid date format' })
    }

    // Validate time format if provided (HH:MM)
    if (sanitizedInput.time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(sanitizedInput.time)) {
      return res.status(400).json({ error: 'Invalid time format' })
    }

    const task = db.createTask(sanitizedInput, userId)
    res.status(201).json(task)
  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// Update task
app.put('/api/tasks/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const { id } = req.params
    const input = req.body as UpdateTaskInput

    // Validate task ID format (UUID)
    if (!validator.isUUID(id)) {
      return res.status(400).json({ error: 'Invalid task ID' })
    }

    // Sanitize inputs
    const sanitizedInput: UpdateTaskInput = {}
    if (input.title !== undefined) sanitizedInput.title = sanitizeString(input.title, 200)
    if (input.note !== undefined) sanitizedInput.note = sanitizeString(input.note, 5000)
    if (input.date !== undefined) sanitizedInput.date = input.date ? sanitizeString(input.date, 10) : null
    if (input.time !== undefined) sanitizedInput.time = input.time ? sanitizeString(input.time, 5) : null
    if (input.status !== undefined && ['todo', 'doing', 'done'].includes(input.status)) {
      sanitizedInput.status = input.status
    }

    // Validate date format if provided
    if (sanitizedInput.date && !validator.isDate(sanitizedInput.date)) {
      return res.status(400).json({ error: 'Invalid date format' })
    }

    // Validate time format if provided
    if (sanitizedInput.time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(sanitizedInput.time)) {
      return res.status(400).json({ error: 'Invalid time format' })
    }

    const task = db.updateTask(id, userId, sanitizedInput)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json(task)
  } catch (error) {
    console.error('Update task error:', error)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// Delete task
app.delete('/api/tasks/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    // Validate task ID format (UUID)
    if (!validator.isUUID(id)) {
      return res.status(400).json({ error: 'Invalid task ID' })
    }

    const deleted = db.deleteTask(id, userId)

    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Delete task error:', error)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})