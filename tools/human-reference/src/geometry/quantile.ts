/**
 * Discrete floor-rank quantile for q in [0,1]; no interpolated population estimate is implied.
 *
 * @evidence contracts/common.md#principled-implementation A floor-rank order statistic selects the declared discrete empirical quantile.
 * @evidence contracts/common.md#clear-and-simple-design q admission and empty-sample behavior are explicit, without interpolating a population model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(n log n) sorting and O(n) temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The input remains unchanged and the temporary sorted copy is released.
 */
export function quantile(values: number[], q: number): number {
  if (!values.length) return NaN;
  if (!(q >= 0 && q <= 1))
    throw new Error("Quantile fraction must lie in [0,1]");
  const sorted: number[] = [...values].sort(
    (a: number, b: number): number => a - b,
  );
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}
