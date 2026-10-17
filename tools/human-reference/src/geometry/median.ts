/**
 * Upper middle order statistic; an empty sample has no median and returns NaN.
 *
 * @evidence contracts/common.md#principled-implementation Sorting a copied sample and choosing its upper middle defines the documented discrete statistic.
 * @evidence contracts/common.md#clear-and-simple-design An empty sample returns NaN rather than inventing a population estimate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(n log n) sorting and O(n) temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The copied sorted sample is released after returning a scalar.
 */
export function median(values: number[]): number {
  if (!values.length) return NaN;
  const sorted: number[] = [...values].sort(
    (a: number, b: number): number => a - b,
  );
  return sorted[Math.floor(sorted.length / 2)];
}
