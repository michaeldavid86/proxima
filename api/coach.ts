// Vercel Serverless Function: POST /api/coach
// Takes a compact mission log, calls Claude, returns a natural-language debrief.
// The ANTHROPIC_API_KEY must be set as a project environment variable in Vercel.
// Never exposed to the frontend.
import Anthropic from '@anthropic-ai/sdk'

// Single-constant swap if you want to step up model quality for a demo:
// change to 'claude-sonnet-4-6' and redeploy.
const CLAUDE_MODEL = 'claude-haiku-4-5'
const MAX_TOKENS = 800

const SYSTEM_PROMPT = `You are a flight-ops coach debriefing a U.S. Air Force Academy cadet after an orbital rendezvous and proximity operations (RPO) training exercise in the PROXIMA simulator. You speak with the tone of an experienced instructor pilot or mission director: direct, operationally grounded, respectful of the cadet's intelligence.

Your debrief should:
1. Lead with the single most important takeaway from this run.
2. Identify one thing the cadet did well and one thing they should work on.
3. Connect at least one decision to a real orbital mechanics principle (Hohmann transfer, RIC frame (Radial, In-track, Cross-track), attribution management, link budget, etc.).
4. Connect at least one decision to Space Force doctrine where relevant (the Space Warfighting Framework of April 2025).
5. Close with one short question that prompts the cadet to reflect on their own decisions.

Keep the debrief to 200 to 300 words. Use American English. Do not use em dashes. Do not use bullet points unless the cadet's mission log has a structured list of errors to address.

The cadet's mission log follows. It contains timestamps, maneuvers executed, actions taken, delta-V consumed, attribution risk over time, link status changes, and mission outcome.`

interface MissionLog {
  missionId?: string
  missionTitle?: string
  outcome?: 'success' | 'failure' | 'aborted'
  durationSec?: number
  objectives?: Array<{ id: string; description: string; met: boolean }>
  maneuvers?: Array<{ t_sec: number; craft: string; direction: string; dv_mps: number; context?: string }>
  actions?: Array<{ t_sec: number; craft: string; actionId: string }>
  finalStats?: Record<string, unknown>
  keyEvents?: Array<{ t_sec: number; description: string }>
}

// Minimal VercelRequest / VercelResponse shape so we do not need @vercel/node.
interface VercelLikeReq {
  method?: string
  body?: unknown
  headers: Record<string, string | string[] | undefined>
}
interface VercelLikeRes {
  status: (code: number) => VercelLikeRes
  json: (data: unknown) => VercelLikeRes
  setHeader: (name: string, value: string) => VercelLikeRes
  end: (body?: unknown) => VercelLikeRes
}

const readJsonBody = async (req: VercelLikeReq): Promise<Record<string, unknown>> => {
  if (req.body && typeof req.body === 'object') return req.body as Record<string, unknown>
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return {}
}

export default async function handler(req: VercelLikeReq, res: VercelLikeRes) {
  // Basic CORS: allow same-origin fetches. If deploying to a different hostname,
  // narrow this to that origin explicitly.
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error:
        'ANTHROPIC_API_KEY not configured on the server. Set it in Vercel project environment variables.',
    })
  }

  const body = await readJsonBody(req)
  const missionLog = body['missionLog'] as MissionLog | undefined
  if (!missionLog) {
    return res.status(400).json({ error: 'missionLog required in request body' })
  }

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(missionLog, null, 2),
        },
      ],
    })
    const text = message.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
    return res.status(200).json({
      coach: text,
      model: CLAUDE_MODEL,
      usage: message.usage,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return res.status(502).json({
      error: 'Upstream call failed',
      detail: msg,
    })
  }
}
