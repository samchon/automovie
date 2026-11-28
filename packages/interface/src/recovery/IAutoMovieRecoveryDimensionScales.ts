/**
 * Independent finite ratios in [0.25, 4] for editing saved image-loft geometry.
 * Width and depth scale about the X/Z frame origin, and height scales about the
 * first saved Y endpoint.
 */
export interface IAutoMovieRecoveryDimensionScales {
  /** Finite X factor in [0.25, 4], applied about the supplied X origin. */
  widthScale: number;

  /** Finite Z factor in [0.25, 4], applied about the supplied Z origin. */
  depthScale: number;

  /**
   * Finite Y factor in [0.25, 4], applied about the lower endpoint of the first
   * saved span.
   */
  heightScale: number;
}
