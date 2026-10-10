import type { ApprovalReview, OutcomeInput } from "./types";

export function approvalReviewError(review?: ApprovalReview): string | null {
  if (!review) return "An approval needs its required review before the case can close.";
  if (!Number.isFinite(review.amountRequested) || review.amountRequested <= 0) {
    return "Enter a valid amount requested in rupees.";
  }
  if (!Number.isFinite(review.amountApproved) || review.amountApproved < 0) {
    return "Enter a valid amount approved in rupees.";
  }
  if (review.amountApproved > review.amountRequested) {
    return "The amount approved cannot be greater than the amount requested.";
  }
  if (!Number.isFinite(review.decisionMinutes) || review.decisionMinutes < 0) {
    return "Enter the time taken to decide in minutes.";
  }
  if (typeof review.queryRaisedFirst !== "boolean") {
    return "Select whether the insurer raised a query first.";
  }
  if (review.queryRaisedFirst && !review.queriedDocument?.trim()) {
    return "Select which document the insurer queried before approval.";
  }
  return null;
}

export function outcomeInputError(input: OutcomeInput): string | null {
  if (input.outcome === "approved") return approvalReviewError(input.approvalReview);
  if (!input.reason?.trim()) {
    return "A query or denial needs the insurer's reason.";
  }
  return null;
}
