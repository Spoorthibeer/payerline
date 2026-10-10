'use client'

export interface PendingApprovalReview {
  id: string
  procedure: string
  payer: string
  createdAt: string
}

const STORAGE_KEY = 'payerline-pending-approval-reviews'

function readPending(): PendingApprovalReview[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (!value) return []
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is PendingApprovalReview =>
        !!item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.procedure === 'string' &&
        typeof item.payer === 'string' &&
        typeof item.createdAt === 'string',
    )
  } catch {
    return []
  }
}

function writePending(items: PendingApprovalReview[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Keep the active form usable if browser storage is unavailable.
  }
}

export function loadPendingApprovalReviews(): PendingApprovalReview[] {
  if (typeof window === 'undefined') return []
  return readPending()
}

export function addPendingApprovalReview(item: PendingApprovalReview): PendingApprovalReview[] {
  const items = [...readPending().filter((pending) => pending.id !== item.id), item]
  writePending(items)
  return items
}

export function removePendingApprovalReview(id: string): PendingApprovalReview[] {
  const items = readPending().filter((pending) => pending.id !== id)
  writePending(items)
  return items
}
