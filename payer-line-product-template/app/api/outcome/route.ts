import type { OutcomeInput } from '@shared/types'
import { loadLedger } from '@server/hindsight'
import { recordOutcome, validateOutcomeInput } from '@server/review'
import { jsonError } from '@/lib/desk-errors'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as OutcomeInput
    const validationError = input ? validateOutcomeInput(input) : 'An outcome needs the case and the insurer result.'
    if (validationError) {
      return Response.json(
        { error: validationError },
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
