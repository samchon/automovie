/**
 * A cross-band depth profile in the construction kernel's millimetres.
 *
 * Port realization converts the authored metre depths once before strip
 * construction. Cross shares and radian loop windows are unchanged. The strip
 * forms a clamped cubic depth spline with zero endpoint depth and slope,
 * samples its derivatives at all declared shares and applies the periodic
 * quintic window to interior sections. Overlapping windows add; original
 * boundary jets remain the strip's rail conditions. This record is borrowed for
 * that build.
 */
export interface IAutoMovieConstructionBandProfile64 {
  /**
   * Interior [cross share, inward-normal depth in millimetres] knots, strictly
   * increasing in share.
   */
  knots: [number, number][];

  /** First loop clock of the full-depth window, radians. */
  start: number;

  /**
   * Last loop clock, radians, with start <= end < start + 2*pi; wrapping is
   * allowed.
   */
  end: number;

  /** Positive radian width of the quintic fade to zero on each side. */
  transition: number;
}
