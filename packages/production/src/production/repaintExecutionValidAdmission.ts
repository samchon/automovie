import { AutoMovieRepaintClaimRefusal } from "./AutoMovieRepaintClaimRefusal";
import { repaintExecutionADMISSION_STATUSES } from "./repaintExecutionADMISSION_STATUSES";
import { AutoMovieRepaintClaimAdmission } from "./repaintAttemptClaim";

/**
 * Accepts only the closed project claim statuses, requiring a nonblank owner for active/unknown reservations and reporting malformed shapes as admission-failed.
 *
 * @evidence contracts/common.md#principled-implementation Accepts only the closed project claim statuses, requiring a nonblank owner for active/unknown reservations and reporting malformed shapes as admission-failed.
 * @evidence contracts/common.md#clear-and-simple-design One admission reader owns the closed status/owner shape; project acquisition and executor dispatch sequencing remain with their existing callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Only the compact admission record escapes; this predicate does not acquire, overwrite or settle a project reservation.
 * @evidence contracts/performance.md#efficient-algorithms Constant field/Set checks exclude unrecognized statuses; hostile getters can throw and are caught by the executor's admission boundary.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the compact admission record escapes; this predicate does not acquire, overwrite or settle a project reservation.
 */
export const repaintExecutionValidAdmission: (value: unknown) => AutoMovieRepaintClaimAdmission | AutoMovieRepaintClaimRefusal = (
  value: unknown,
): AutoMovieRepaintClaimAdmission | AutoMovieRepaintClaimRefusal => {
  const candidate: { status?: unknown; ownerAttemptId?: unknown; } = value as { status?: unknown; ownerAttemptId?: unknown };
  const status: unknown = candidate?.status;
  if (
    typeof status !== "string" ||
    repaintExecutionADMISSION_STATUSES.has(
      status as AutoMovieRepaintClaimAdmission["status"],
    ) === false
  )
    return {
      status: "admission-failed",
      message:
        "Repaint attempt claim store answered outside the admission contract.",
    };
  const admitted: "acquired" | "already-active" | "prefix-changed" | "unknown-outcome" = status as AutoMovieRepaintClaimAdmission["status"];
  if (admitted === "acquired" || admitted === "prefix-changed")
    return { status: admitted };
  if (
    typeof candidate.ownerAttemptId !== "string" ||
    candidate.ownerAttemptId.trim().length === 0
  )
    return {
      status: "admission-failed",
      message: `Repaint attempt claim store reported ${admitted} without naming the owning attempt.`,
    };
  return { status: admitted, ownerAttemptId: candidate.ownerAttemptId };
};
