/**
 * Supplied horizontal orthographic camera in a metric XZ frame.
 * Positive image U projects cos(azimuth) X + sin(azimuth) Z;
 * positive image V projects negative Y. Pixel centres have half-integer coordinates.
 *
 * @evidence contracts/common.md#principled-implementation An azimuth, square-pixel pitch and principal point define the supplied orthographic chart without estimating calibration or admitting perspective distortion.
 * @evidence contracts/common.md#clear-and-simple-design Captures and saved support observations share one named camera contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No camera inference, specimen-specific projection or silent rectification is represented.
 * @evidence contracts/common.md#meaningful-documentation States projection signs, radians, positive millimetres per pixel, origin coordinates and supplied-calibration meaning.
 */
export interface IAutoMovieRecoveryImageCamera {
  /** Horizontal orthographic projection; perspective and distortion are unsupported. */
  type: "horizontal-orthographic";

  /** Calibration is supplied by the caller, not estimated from the image. */
  calibration: "supplied";

  /** Positive image-U direction, radians from +X toward +Z. */
  azimuthRadians: number;

  /** Finite positive millimetres per pixel along either square-pixel axis. */
  pixelPitchMm: number;

  /** Pixel-edge coordinates [u0, v0] of the common metric-frame origin. */
  principalPointPx: [number, number];
}
