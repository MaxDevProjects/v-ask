import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { Request, Response, NextFunction } from 'express'
import type { UserPublic } from './types.js'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined. Please set it in the environment variables.')
}
const JWT_EXPIRES_IN = '7d'

export interface AuthRequest extends Request {
  user?: UserPublic
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateToken = (user: UserPublic): string => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export const verifyToken = (token: string): UserPublic | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPublic & { iat: number; exp: number }
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      created_at: 0 // We don't store this in the token
    }
  } catch {
    return null
  }
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Check for token in cookie first, then Authorization header
  const cookieToken = req.cookies?.token
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null

  const token = cookieToken || headerToken

  if (!token) {
    res.status(401).json({ error: 'Authentification requise' })
    return
  }

  const user = verifyToken(token)

  if (!user) {
    res.status(401).json({ error: 'Token invalide ou expiré' })
    return
  }

  req.user = user
  next()
}

export const setTokenCookie = (res: Response, token: string): void => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true, // Always secure in production
    sameSite: 'strict', // Stricter cookie policy
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
}

export const clearTokenCookie = (res: Response): void => {
  res.clearCookie('token')
}