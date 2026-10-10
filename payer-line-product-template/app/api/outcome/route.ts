import type { OutcomeInput } from '@shared/types'
import { loadLedger } from '@server/hindsight'
import { recordOutcome } from '@server/review'
import { jsonError } from '@/lib/desk-errors'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as OutcomeInput
    if (!input?.payerId || !input.caseSnapshot || !input.outcome || !input.reason?.trim()) {
      return Response.json(
        { error: "An outcome needs the case, the result, and the insurer's reason." },
        { status: 400 },
      )
    }
    const saved = await recordOutcome(input)
    const entries = await loadLedger(input.payerId)
    return Response.json({ ...saved, entries })
  } catch (error) {
    return jsonError(error)
  }
}
