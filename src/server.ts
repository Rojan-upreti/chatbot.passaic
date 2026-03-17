import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { getChatResponse } from './chat'
import { getAuthUser, getUserContext } from './supabase'
import type { ChatRequest, ChatResponse, ErrorResponse } from './types'
import type { Message } from './types'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000'

const FALLBACK_MESSAGE =
  "I'm having trouble right now. For help, contact the Board of Social Services at (973) 881-4800."

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ['POST', 'OPTIONS', 'GET'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(express.json())

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'chatbot-api' })
})

// ── POST /chat ────────────────────────────────────────────────────────────────
app.post(
  '/chat',
  async (
    req: Request<object, ChatResponse | ErrorResponse, Partial<ChatRequest>>,
    res: Response<ChatResponse | ErrorResponse>
  ) => {
    try {
      const { messages } = req.body

      if (!Array.isArray(messages) || messages.length === 0) {
        res.json({ response: FALLBACK_MESSAGE })
        return
      }

      const validMessages: Message[] = messages
        .filter(
          (m): m is Message =>
            m &&
            typeof m === 'object' &&
            typeof (m as Message).content === 'string'
        )
        .map((m) => ({
          role: (m as Message).role === 'assistant' ? 'assistant' : 'user',
          content: String((m as Message).content),
        }))

      // ── Determine mode: guest vs. authenticated ──────────────────────────
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // ── Guest mode: no token present ──────────────────────────────────
        console.log('[POST /chat] guest mode')
        const response = await getChatResponse(validMessages, null)
        res.json({ response })
        return
      }

      // ── Authenticated mode ─────────────────────────────────────────────
      const token = authHeader.slice('Bearer '.length)

      const user = await getAuthUser(token)
      if (!user) {
        res.status(401).json({
          response:
            'Your session has expired. Please sign in again to get personalized help.',
        })
        return
      }

      console.log(`[POST /chat] authenticated user: ${user.id}`)

      const userContext = await getUserContext(user.id)
      const response = await getChatResponse(validMessages, userContext)
      res.json({ response })
    } catch (error) {
      console.error('[POST /chat]', error)
      res.status(500).json({ response: FALLBACK_MESSAGE })
    }
  }
)

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`  chatbot-api running on http://localhost:${PORT}`)
  console.log(`   CORS allowed origin: ${ALLOWED_ORIGIN}`)
  console.log(`   Modes: guest (no token) + authenticated (Bearer token)`)
})
