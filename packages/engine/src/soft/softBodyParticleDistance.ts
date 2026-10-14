/** Measure the Euclidean distance between two particle triples in a flat position array.
 *
 * @evidence contracts/common.md#principled-implementation Coordinate differences are squared and square-rooted; valid indices and dense finite triples are caller premises. Very small squares may underflow and very large squares may overflow, so this is not an all-finite-input robust norm.
 * @evidence contracts/common.md#clear-and-simple-design One distance owner serves canonical rest lengths, current strain and shortest-edge budgeting, preserving their identical arithmetic expression.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No origin substitution, fixture distance or precision clamp changes the authored triples; unsupported extreme arithmetic remains explicit.
 * @evidence contracts/common.md#meaningful-documentation States flat triple indexing, caller admission and square arithmetic limitations.
 * @evidence contracts/performance.md#efficient-algorithms Six coordinate reads and fixed scalar arithmetic take constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work Reusing this arithmetic prevents rest/current expression drift; changing positions invalidates values, so distances are not cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The numeric result transfers to the caller and the supplied array remains unmodified and unretained.
 */
export const softBodyParticleDistance: (
  values: ArrayLike<number>,
  a: number,
  b: number,
) => number = (values: ArrayLike<number>, a: number, b: number): number => {
  const dx: number = values[b * 3] - values[a * 3];
  const dy: number = values[b * 3 + 1] - values[a * 3 + 1];
  const dz: number = values[b * 3 + 2] - values[a * 3 + 2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};
