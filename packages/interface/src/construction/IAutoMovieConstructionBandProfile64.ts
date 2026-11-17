/**
 * A cross-band depth profile in the construction kernel's millimetres.
 *
 * Port realization converts the authored metre depths once before strip
 * construction. Cross shares and radian loop windows are unchanged. The strip
 * forms a clamped cubic depth spline with zero endpoint depth and slope, samples
 * its derivatives at all declared shares and applies the periodic quintic window
 * to interior sections. Overlapping windows add; original boundary jets remain
 * the strip's rail conditions. This record is borrowed for that build.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes kernel millimetres from authored metres, identifies the conversion owner and states span shares, periodic window units and build lifetime.
 * @evidence contracts/development/design.md#principled-representation Ordered cross shares in (0,1) and finite millimetre depths describe the converted spline controls; construction admission owns their validity before realization.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Port realization and the shared strip section builder exchange this converted profile; authored profile declarations retain their separate metre contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No new interpolation, fitted shape or hidden unit conversion is introduced; an authored record is converted explicitly at the kernel boundary.
 */
export interface IAutoMovieConstructionBandProfile64 {
  /** Interior [cross share, inward-normal depth in millimetres] knots, strictly increasing in share. */
  knots: [number, number][];

  /** First loop clock of the full-depth window, radians. */
  start: number;

  /** Last loop clock, radians, with start <= end < start + 2*pi; wrapping is allowed. */
  end: number;

  /** Positive radian width of the quintic fade to zero on each side. */
  transition: number;
}
