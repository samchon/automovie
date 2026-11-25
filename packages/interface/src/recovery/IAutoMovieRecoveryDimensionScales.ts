/**
 * Independent dimensionless coordinate edits of a saved image-recovery field. X
 * and Z scale about the supplied frame origin; Y scales about the first saved
 * station.
 */
export interface IAutoMovieRecoveryDimensionScales {
  /** Finite X scale in [0.25, 4], about the supplied frame origin. */
  widthScale: number;

  /** Finite Z scale in [0.25, 4], about the supplied frame origin. */
  depthScale: number;

  /** Finite Y scale in [0.25, 4], about the first saved station. */
  heightScale: number;
}
