/**
 * Samples a declared trunk interval and reserves each training interval's midpoint.
 * Heights and maximum spacing are millimetres in the manifest's fixed frame.
 * The caller supplies anatomical or geometric boundary provenance; this operation
 * chooses no clinical level and cannot certify a topology event at either end.
 *
 * @evidence contracts/common.md#principled-implementation Equal subdivisions retain both declared boundaries and bound the training spacing. Reserved midpoints differ from every emitted training station by construction; other fitting inputs require their own exclusion policy.
 * @evidence contracts/common.md#clear-and-simple-design Owns only physical station placement; source cutting, branch detection and curve fitting remain separate operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reference identity or expected measurement changes the grid. Invalid intervals and unbounded station counts are rejected rather than silently altered.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, boundary responsibility, topology uncertainty and the limited meaning of reservation.
 * @evidence contracts/performance.md#efficient-algorithms Emits n training intervals and their midpoints in O(n) time and O(n) returned storage, with no sort or source traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Computes the interval count once and derives both families from the same ordered grid, preserving corresponding midpoint definitions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the returned arrays; the caller owns their lifetime. The admitted interval count is at most one million to bound one operation's memory.
 */
export function trunkLevelStations(
  lowerHeightMm: number,
  upperHeightMm: number,
  spacingMm: number,
): { training: number[]; validation: number[] } {
  if (
    ![lowerHeightMm, upperHeightMm, spacingMm].every(Number.isFinite) ||
    upperHeightMm <= lowerHeightMm ||
    spacingMm <= 0
  )
    throw new Error(
      "Trunk interval and station spacing must be finite and positive",
    );
  const count: number = Math.ceil((upperHeightMm - lowerHeightMm) / spacingMm);
  if (!Number.isSafeInteger(count) || count > 1_000_000)
    throw new Error(
      "Trunk station request exceeds the operation's point budget",
    );
  const training: number[] = [];
  const validation: number[] = [];
  const intervalMm: number = (upperHeightMm - lowerHeightMm) / count;
  for (let k: number = 0; k <= count; k++) {
    training.push(k === count ? upperHeightMm : lowerHeightMm + k * intervalMm);
    if (k < count) validation.push(lowerHeightMm + (k + 0.5) * intervalMm);
  }
  return { training, validation };
}
