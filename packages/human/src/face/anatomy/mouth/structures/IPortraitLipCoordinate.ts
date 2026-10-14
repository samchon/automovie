/**
 * Coordinates within one lip band, independent of a particular mesh's IDs.
 *
 * @evidence contracts/common.md#principled-implementation Side, lateral and across locate one point in the curved normalized vermilion band.
 * @evidence contracts/common.md#clear-and-simple-design The authoritative band sampler supplies these coordinates to thickness and relief consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates carry no mesh ids or reconstructed Z depth and do not establish anatomical plausibility.
 * @evidence contracts/common.md#meaningful-documentation Lateral runs right minus one to left plus one, across cutaneous zero to oral one, and side is independent of left/right.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Coordinate calculation executes in createPortraitLipBandSampler.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same coordinate can feed band/section consumers without independent upper/lower classification.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Small returned records belong to callers and this type owns no source mesh or sampler handle.
 *
 * @author Samchon
 */
export interface IPortraitLipCoordinate {
  /** Upper or lower vermilion band; independent of anatomical left/right. */
  side: "upper" | "lower";

  /** -1 at the anatomical right inner corner, +1 at the left. */
  lateral: number;

  /** Zero at the cutaneous border, one at the oral aperture. */
  across: number;
}
