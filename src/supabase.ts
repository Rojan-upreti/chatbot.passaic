import { createClient } from '@supabase/supabase-js'
import type { UserContext } from './types'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Authenticated chat will not work until these are configured in .env'
  )
}

// Service-role client bypasses RLS — used only for server-side lookups
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

/**
 * Validates a Supabase user JWT and returns the authenticated user.
 * Returns null if the token is invalid or expired.
 */
export async function getAuthUser(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

/**
 * Fetches SNAP work data for a given user ID and builds a UserContext.
 *
 * ⚠️  UPDATE THE TABLE AND COLUMN NAMES BELOW to match your Supabase schema.
 *
 * Expected table: `snap_users` (or whatever your table is named)
 * Expected columns:
 *   - full_name         → UserContext.name
 *   - verified_hours    → UserContext.verifiedHours
 *   - pending_hours     → UserContext.pendingHours
 *   - pending_count     → UserContext.pendingCount
 *   - report_status     → UserContext.reportStatus
 *   - preferred_language → UserContext.language  (optional, defaults to 'en')
 */
export async function getUserContext(userId: string): Promise<UserContext> {
  const now = new Date()
  const monthName = now.toLocaleString('en-US', { month: 'long' })
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeftInMonth = daysInMonth - now.getDate()

  // ── DB QUERY ──────────────────────────────────────────────────────────────
  // TODO: Replace 'snap_users' with your actual table name.
  // TODO: Replace column names to match your schema.
  const { data, error } = await supabaseAdmin
    .from('snap_users')          // ← change to your table name
    .select(
      'full_name, verified_hours, pending_hours, pending_count, report_status, preferred_language'
    )
    .eq('user_id', userId)       // ← change 'user_id' if your FK column has a different name
    .single()
  // ─────────────────────────────────────────────────────────────────────────

  if (error || !data) {
    throw new Error(`[getUserContext] Could not load user data for ${userId}: ${error?.message}`)
  }

  return {
    name:            data.full_name          ?? 'there',
    verifiedHours:   Number(data.verified_hours  ?? 0),
    pendingHours:    Number(data.pending_hours   ?? 0),
    pendingCount:    Number(data.pending_count   ?? 0),
    daysLeftInMonth,
    monthName,
    reportStatus:    data.report_status      ?? 'unknown',
    language:        data.preferred_language ?? 'en',
  }
}
