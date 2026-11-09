/**
 * One automatically linked, geometrically retained landmark observation.
 *
 * @evidence contracts/development/design.md#principled-representation A source-order view and its feature identity bind an unchanged integer-centre pixel chart to one provisional 3D landmark.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named record is shared by map refinement and publication without retaining feature descriptors.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Track linkage and reprojection support do not assert physical material identity or fill an absent observation.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish source order, per-image feature identity and pixel coordinates.
 */
export interface IAutoMovieRecoveryMapObservation {
  /** Index in the owning operation's source array; zero and one are the seed. */
  viewIndex: number;

  /** Index in this image's once-observed feature population. */
  featureIndex: number;

  /** Measured [x,y] image pixel centre, with +X right and +Y down. */
  pixel: [number, number];
}
