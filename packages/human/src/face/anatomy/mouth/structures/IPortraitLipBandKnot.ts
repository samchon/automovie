/**
 * One thickness-ratio witness along the right(-1) to left(+1) oral span.
 *
 * @evidence contracts/common.md#principled-implementation Ordered lateral witnesses state positive authored thickness ratios with identity corner endpoints.
 * @evidence contracts/common.md#clear-and-simple-design createPortraitLipBandScale owns admitted scalar or knot-profile interpolation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ratios alter the existing band rather than measuring tissue thickness or changing the aperture independently.
 * @evidence contracts/common.md#meaningful-documentation at is anatomical right minus one to left plus one and scale one preserves thickness.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Knot admission and interpolation occur in the sampler producer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One copied profile is reused across lip constraints; this type stores no memoized samples.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller arrays own authored knots and the compiled scale closure owns copied records.
 *
 * @author Samchon
 */
export interface IPortraitLipBandKnot {
  /** Ordered transverse fraction from anatomical right (-1) to left (+1). */
  at: number;

  /** Positive ratio of the current band's vertical thickness; one is identity. */
  scale: number;
}
