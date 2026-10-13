/**
 * Read the largest Euclidean displacement of an existing boundary whose two admitted flat fields share native vertex indices and body-frame metres. Empty boundary returns zero and inputs remain unchanged. Finite aligned fields are a caller premise; this observer adds no index/finite validation. It reports the actual assembly step, not a clearance tolerance, clinical acceptance or current visual result.
 *
 * @evidence contracts/common.md#principled-implementation Same-index before/after coordinates determine the actual maximum metre displacement without another fitted surface or target.
 * @evidence contracts/common.md#clear-and-simple-design One scalar maximum summarizes the ordered boundary while seam conformity/admission remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty input retains zero, no anatomical bound or clinical/GPU acceptance is fabricated, and aligned finite-input premises remain explicit.
 * @evidence contracts/common.md#meaningful-documentation Prose states Euclidean metre units, native correspondence, empty behavior and observation-only meaning.
 * @evidence contracts/performance.md#efficient-algorithms B boundary vertices perform fixed three-coordinate distance and maximum arithmetic in O(B) time.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each before/after field pair is observed afresh; this scalar reader owns no seam result cache or request coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar observation retains no buffer, callback, task or resource beyond the returned number.
 */
export function measureHumanBoundaryDisplacement(
  boundary: readonly number[],
  before: readonly number[],
  after: readonly number[],
): number {
  let maximum: number = 0;
  for (const vertex of boundary)
    maximum = Math.max(maximum, Math.hypot(
      after[3 * vertex] - before[3 * vertex],
      after[3 * vertex + 1] - before[3 * vertex + 1],
      after[3 * vertex + 2] - before[3 * vertex + 2],
    ));
  return maximum;
}
