/**
 * Admit the existing legacy upper-lash count policy: an integer in [1,160], unchanged before strand allocation. The cited review's typical population range motivated the historical envelope but does not establish a universal anatomical ceiling. Connected explicit shaft populations use their separate zero-inclusive rendering budget. Refusal identifies this legacy authoring interval, and no count is clamped or inferred.
 *
 * @evidence contracts/common.md#principled-implementation The legacy eye path requires an integer count in its existing one-to-160 authoring envelope.
 * @evidence contracts/common.md#clear-and-simple-design This policy remains distinct from connected explicit shaft populations which use their own zero-inclusive resource cap.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A review's descriptive typical lash range does not prove a hard anatomical ceiling; this validator enforces the existing legacy convention only.
 * @evidence contracts/common.md#meaningful-documentation Refusal now names the legacy envelope without asserting that every living lid is bounded by it.
 * @evidence contracts/performance.md#efficient-algorithms Three scalar integer/range checks take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work resolvePortraitEyeInputs calls this owner before allocating legacy eye strands.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the borrowed number is read and no population or cache is allocated.
 */
export function assertPortraitUpperLashCount(count: number): void {
  if (!Number.isInteger(count) || count < 1 || count > 160)
    throw new Error(
      `Legacy upper-lash count must be an integer in [1,160]; ${count} requested.`,
    );
}
