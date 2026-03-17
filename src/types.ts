/**
 * Shared chatbot types.
 * These mirror the types in the Next.js app (snap-connect/lib/chatbot/types.ts).
 */

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export type UserContext = {
  name: string
  verifiedHours: number
  pendingHours: number
  pendingCount: number
  daysLeftInMonth: number
  monthName: string
  reportStatus: string
  language: string
}

export type ChatRequest = {
  messages: Message[]
  userContext?: UserContext
}

export type ChatResponse = {
  response: string
}

export type ErrorResponse = {
  error: string
}
