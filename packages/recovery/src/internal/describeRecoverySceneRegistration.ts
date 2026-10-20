import type { IAutoMovieRecoveryCameraSceneEstimate } from "../structures/image/IAutoMovieRecoveryCameraSceneEstimate";
import type { IAutoMovieRecoverySceneRegistration } from "../structures/image/IAutoMovieRecoverySceneRegistration";
import type { IAutoMovieRecoverySceneCandidate } from "../structures/internal/IAutoMovieRecoverySceneCandidate";

/**
 * Describe all requested views against the final accepted component revision.
 *
 * @evidence contracts/common.md#principled-implementation Registered poses, distinct necessary support and same-revision attempt refusals remain separate; a past-revision failure is linked without being relabelled as a current attempt.
 * @evidence contracts/common.md#clear-and-simple-design This ledger owner derives source statuses from completed geometry without choosing poses, changing counters or fitting again.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null poses never become accepted through appearance counts, and budget exhaustion is not reported as an attempted geometric refusal when no attempt ran.
 * @evidence contracts/common.md#meaningful-documentation States current-revision semantics, last-attempt linkage, initial seed absence and candidate versus inlier support.
 * @evidence contracts/performance.md#efficient-algorithms A single O(A+V) pass finds last attempt indices and emits V records using the already computed revision support table.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing accepted poses and shared support/attempt records supply every field without geometry or descriptor recomputation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only owned scalar/reason records return; borrowed scene/support data is not mutated and no resource is acquired.
 */
export function describeRecoverySceneRegistration(
  result: IAutoMovieRecoveryCameraSceneEstimate,
  support: readonly (readonly IAutoMovieRecoverySceneCandidate[])[],
): IAutoMovieRecoverySceneRegistration[] {
  const last: (number | null)[] = result.poses.map((): null => null);
  result.attempts.forEach(
    (attempt: (typeof result.attempts)[number], at: number): void => {
      last[attempt.viewIndex] = at;
    },
  );
  return result.poses.map(
    (
      pose: (typeof result.poses)[number],
      viewIndex: number,
    ): IAutoMovieRecoverySceneRegistration => {
      const candidates: number = support[viewIndex]!.length;
      const lastAttempt: number | null = last[viewIndex]!;
      if (pose !== null)
        return {
          viewIndex,
          status: "registered",
          candidates,
          lastAttempt,
          reasons: [],
        };
      if (result.registeredViews.length === 0)
        return {
          viewIndex,
          status: "not-attempted",
          candidates,
          lastAttempt,
          reasons: ["seed-component-unavailable"],
        };
      if (candidates < result.policy.minimumResectionInliers)
        return {
          viewIndex,
          status: "insufficient-support",
          candidates,
          lastAttempt,
          reasons: ["insufficient-distinct-existing-map-support"],
        };
      if (
        lastAttempt !== null &&
        result.attempts[lastAttempt]!.revision === result.revision
      )
        return {
          viewIndex,
          status: "refused",
          candidates,
          lastAttempt,
          reasons: result.attempts[lastAttempt]!.reasons.slice(),
        };
      return {
        viewIndex,
        status: "not-attempted",
        candidates,
        lastAttempt,
        reasons: [
          result.stopReason === "budget-exhausted"
            ? "scene-work-budget-exhausted-before-attempt"
            : "no-remaining-qualified-transaction",
        ],
      };
    },
  );
}
