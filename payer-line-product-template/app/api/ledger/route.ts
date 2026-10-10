import { PAYERS } from '@shared/payers'
import { loadLedger } from '@server/hindsight'
import { jsonError } from '@/lib/desk-errors'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const requested = url.searchParams.get('payer') || 'meridian'
    const payer = PAYERS.find((item) => item.id === requested) ?? PAYERS[0]
    const entries = await loadLedger(payer.id)
    return Response.json({ payer, bankId: payer.bankId, entries })
  } catch (error) {
    return jsonError(error)
  }
}
