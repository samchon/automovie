/**
 * How much of the smooth Catmull-Clark edge rule an edge of the given
 * sharpness takes; the rest is the sharp midpoint rule.
 *
 * DeRose, Kass and Truong (1998) use the sharp rule for sharpness of one or
 * more and interpolate linearly between the smooth and sharp edge points for a
 * fractional sharpness below one, so the smooth share is `1 - s` there and zero
 * from one upwards, including boundary edges at 10.
 *
 * @param sharpness Edge sharpness from 0 to 10.
 * @returns The weight of the smooth edge point, from 0 to 1.
 *
 * @evidence contracts/common.md#principled-implementation The published fractional edge rule: an edge point is `(1 - s)` times the smooth point plus `s` times the midpoint for `s` below one, and the midpoint from one upwards.
 * @evidence contracts/common.md#clear-and-simple-design One rule shared by level refinement, face-varying UVs and the limit ring, so every edge point weighs sharpness alike.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case beyond the published threshold at one.
 * @evidence contracts/common.md#meaningful-documentation States the weight, the threshold and the source.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One comparison and one subtraction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure scalar function with nothing to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
 */
export const subdivisionEdgeSmoothness = (sharpness: number): number =>
  sharpness >= 1 ? 0 : 1 - sharpness;
