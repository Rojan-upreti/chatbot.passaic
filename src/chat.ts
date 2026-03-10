import Anthropic from '@anthropic-ai/sdk'
import type { Message, UserContext } from './types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SNAP_RULES = `You are SnapAssist, a helpful assistant for SNAP recipients in Passaic County, NJ. You help them meet the 80-hour monthly work requirement.

SNAP rules you know:
- Recipients ages 18-64 without dependents must complete 80 hours per month
- Qualifying activities: paid work, unpaid/in-kind work, SNAP career or technical education programs, volunteering with approved organizations
- Hours must be verified by a supervisor or coordinator
- Verified hours must be submitted to Passaic County Board of Social Services by month end
- Missing a month can result in loss of benefits
- Does NOT count: informal neighbor help, unapproved orgs, self-reported unverified hours, prior month hours

Response rules:
- 6th grade reading level
- Maximum 4 sentences per response
- Warm, patient, never judgmental
- Never make official eligibility decisions
- Always end with: "For official help, contact the Board of Social Services at (973) 881-4800."
- If the user writes in Spanish, respond entirely in Spanish
- Never ask for SNAP card numbers or SSN`

export async function getChatResponse(
  messages: Message[],
  userContext: UserContext
): Promise<string> {
  const dynamicContext = `
Current user context (use their name and numbers when relevant):
- Name: ${userContext.name}
- Verified hours this month: ${userContext.verifiedHours}
- Hours still needed to reach 80: ${Math.max(0, 80 - userContext.verifiedHours)}
- Pending verifications: ${userContext.pendingCount} entries (${userContext.pendingHours} hours awaiting approval)
- Days left in ${userContext.monthName}: ${userContext.daysLeftInMonth}
- Report status: ${userContext.reportStatus}
- Met 80-hour goal: ${userContext.verifiedHours >= 80 ? 'Yes' : 'No'}

Use their name naturally and reference their specific numbers when it helps answer their question.`

  const systemPrompt = `${SNAP_RULES}\n\n${dynamicContext}`

  const anthropicMessages = messages.map((m) => ({
    role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: m.content,
  }))

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: anthropicMessages,
  })

  const textParts = (response.content as Array<{ type: string; text?: string }>)
    .filter((block) => block.type === 'text' && block.text)
    .map((b) => b.text as string)

  return textParts.join('').trim() || ''
}
