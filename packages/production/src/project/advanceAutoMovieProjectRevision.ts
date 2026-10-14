import type { AutoMovieProjectRevisionAdvance } from "./AutoMovieProjectRevisionAdvance";

/**
 * Select the exact next revision before a guarded mutation writes any bytes.
 *
 * The caller publishes the successor only after its mutation succeeds.
 * Invalid input and an exhausted safe-integer clock are distinct refusals.
 *
 * @evidence contracts/common.md#principled-implementation Addition by one is exact below Number.MAX_SAFE_INTEGER; domain admission and exhaustion prevent rounding from repeating a generation identity.
 * @evidence contracts/common.md#clear-and-simple-design One pure decision leaves guarded mutation and publication with the project transaction owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid and exhausted clocks are refused without rounding, wrapping or resetting.
 * @evidence contracts/common.md#meaningful-documentation Defines pre-write timing, refusal causes and successful-mutation publication ownership.
 * @evidence contracts/performance.md#efficient-algorithms Fixed numeric checks and one addition take constant time and result space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A successor answers one current revision and cannot stand for a later mutation generation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The pure function returns scalar data and owns no retained state or resource.
 */
export function advanceAutoMovieProjectRevision(revision: number): AutoMovieProjectRevisionAdvance {
  if (!Number.isSafeInteger(revision) || revision < 0) return { state: "invalid" };
  if (revision === Number.MAX_SAFE_INTEGER) return { state: "exhausted" };
  return { state: "next", revision: revision + 1 };
}
