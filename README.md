# chatbot-api

Standalone Express backend powering the SnapAssist chatbot for SNAP Work Connect.

## Overview

This is an independent Node.js service. It exposes a single `POST /chat` endpoint that takes a conversation history + user context and returns an AI response from Anthropic Claude.

The main Next.js app (`snap-connect`) calls this service via its `/api/ai/chat` route, which proxies requests here.

## Setup

```bash
cd chatbot_api
npm install
cp .env.example .env
# Fill in ANTHROPIC_API_KEY in .env
```

## Running

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

Runs on **port 3001** by default. Change via `PORT` in `.env`.

## Endpoints

### `GET /health`
Returns `{ status: "ok", service: "chatbot-api" }`.

### `POST /chat`
**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "How many hours do I need?" }
  ],
  "userContext": {
    "name": "Maria",
    "verifiedHours": 32,
    "pendingHours": 8,
    "pendingCount": 2,
    "daysLeftInMonth": 14,
    "monthName": "March",
    "reportStatus": "DRAFT",
    "language": "en"
  }
}
```

**Response:**
```json
{
  "response": "Hi Maria! You still need 48 more verified hours this month. ..."
}
```

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | — |
| `PORT` | Port to listen on | `3001` |
| `ALLOWED_ORIGIN` | CORS allowed origin | `http://localhost:3000` |

## Directory structure

```
chatbot_api/
  src/
    server.ts    Express entry point, route handlers
    chat.ts      getChatResponse — Anthropic API logic + SNAP system prompt
    types.ts     Message, UserContext, ChatRequest, ChatResponse types
  package.json
  tsconfig.json
  .env.example
  README.md
```
