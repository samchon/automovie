/**
 * Independent dimensionless coordinate edits of a saved image-recovery field.
 * X and Z scale about the supplied frame origin; Y scales about the first saved station.
 *
 * @evidence contracts/common.md#principled-implementation A positive diagonal coordinate map preserves the other two axis extents for each independent edit; support-plane recipes transform their equations accordingly.
 * @evidence contracts/common.md#clear-and-simple-design Elliptical and finite-support recipes share the same three existing edit quantities and anchors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These ratios do not infer new measurements or authorize completing unobserved regions.
 * @evidence contracts/common.md#meaningful-documentation States dimensionless finite bounds and the coordinate and anchor for each scale.
 */
export interface IAutoMovieRecoveryDimensionScales {
  /** Finite X scale in [0.25, 4], about the supplied frame origin. */
  widthScale: number;

  /** Finite Z scale in [0.25, 4], about the supplied frame origin. */
  depthScale: number;

  /** Finite Y scale in [0.25, 4], about the first saved station. */
  heightScale: number;
}
