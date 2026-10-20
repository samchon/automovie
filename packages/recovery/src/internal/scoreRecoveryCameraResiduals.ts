/**
 * Collect finite absolute residuals within an inclusive pixel threshold.
 * Returned indices preserve observation order; quantiles use linear interpolation
 * at (N-1)*q. Empty support has null diagnostics, never a perfect zero error.
 *
 * @evidence contracts/common.md#principled-implementation Each finite residual is an observation of the supplied error definition; its magnitude is compared inclusively with the declared threshold. Ordered support and linear-interpolated median/p90 report only the retained finite population.
 * @evidence contracts/common.md#clear-and-simple-design One scoring convention serves calibrated Sampson consensus and planar transfer competition without conflating their distinct pixel metrics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null and nonfinite observations are never inliers, empty populations are not perfect fits, and no sorted prefix or fixture-specific cutoff discards an admitted residual.
 * @evidence contracts/common.md#meaningful-documentation States inclusive threshold, absolute units, observation-order indices, quantile interpolation and empty-support meaning.
 * @evidence contracts/performance.md#efficient-algorithms N observations need O(N) scanning and O(M log M) sorting of M retained magnitudes with O(M) scratch; the small admitted correspondence population bounds this repeated proposal statistic.
 * @evidence contracts/performance.md#reuse-equivalent-work One retained/sorted population supplies both median and p90; input order is preserved separately for later fitting subsets.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only owned indices and nullable scalars escape; sorted temporary errors expire and no observation array, image, cache or external handle is retained.
 */
export function scoreRecoveryCameraResiduals(
  residuals: readonly (number | null)[],
  thresholdPx: number,
): { indices: number[]; medianPx: number | null; p90Px: number | null } {
  if (!(thresholdPx > 0) || !Number.isFinite(thresholdPx))
    throw new Error("camera-score: finite positive pixel threshold required");
  const indices: number[] = [],
    values: number[] = [];
  for (let at: number = 0; at < residuals.length; at++) {
    const residual: number | null = residuals[at]!;
    if (
      residual !== null &&
      Number.isFinite(residual) &&
      Math.abs(residual) <= thresholdPx
    ) {
      indices.push(at);
      values.push(Math.abs(residual));
    }
  }
  values.sort((a: number, b: number): number => a - b);
  if (values.length === 0) return { indices, medianPx: null, p90Px: null };
  const medianAt: number = (values.length - 1) / 2,
    p90At: number = 0.9 * (values.length - 1);
  const medianLower: number = Math.floor(medianAt),
    p90Lower: number = Math.floor(p90At);
  return {
    indices,
    medianPx:
      values[medianLower]! +
      (values[Math.ceil(medianAt)]! - values[medianLower]!) *
        (medianAt - medianLower),
    p90Px:
      values[p90Lower]! +
      (values[Math.ceil(p90At)]! - values[p90Lower]!) * (p90At - p90Lower),
  };
}
