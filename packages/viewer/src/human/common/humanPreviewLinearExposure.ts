/**
 * The tone mapping exposure at which a grey of linear radiance `radiance`
 * displays at relative luminance `target` through the linear transform:
 * their ratio.
 *
 * @evidence contracts/common.md#principled-implementation For positive admitted radiance and a target strictly between zero and one, linear exposure is target divided by radiance. Positive infinity currently passes the radiance gate and gives zero; extremely small finite radiance can overflow the ratio, so finite representable calibration values are a caller premise.
 * @evidence contracts/common.md#clear-and-simple-design One ratio owns the linear transform calibration rather than searching a filmic curve or adjusting model materials.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No viewer identity or observed photograph changes the ratio. The result only applies to a linear transform; it does not compensate for arbitrary filmic tone mapping.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies linear radiance, relative-luminance target and the transform assumption; zero/nonpositive and out-of-range targets refuse.
 * @evidence contracts/performance.md#efficient-algorithms Two admission predicates and one division require constant work and scalar storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The pure ratio has no retained cache; the balancing owner computes it once per current card rather than treating matching subject identity as equal lighting.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a number and retains no input, native handle or running task.
 */
export function humanPreviewLinearExposure(
  radiance: number,
  target: number,
): number {
  if (!(radiance > 0) || !(target > 0 && target < 1))
    throw new Error("Exposure needs a positive radiance and a target below 1.");
  return target / radiance;
}
