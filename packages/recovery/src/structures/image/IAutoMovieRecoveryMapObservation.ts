/**
 * One automatically linked, geometrically retained landmark observation.
 *
 * @evidence contracts/common.md#principled-implementation A source-order view and its feature identity bind an unchanged integer-centre pixel chart to one provisional 3D landmark.
 * @evidence contracts/common.md#clear-and-simple-design The named record is shared by map refinement and publication without retaining feature descriptors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Track linkage and reprojection support do not assert physical material identity or fill an absent observation.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish source order, per-image feature identity and pixel coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record defines no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Plain owned data acquires no external resource.
 */
export interface IAutoMovieRecoveryMapObservation {
  /** Index in the three-source array; zero and one are the seed. */
  viewIndex: number;

  /** Index in this image's once-observed feature population. */
  featureIndex: number;

  /** Measured [x,y] image pixel centre, with +X right and +Y down. */
  pixel: [number, number];
}
