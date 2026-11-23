/**
 * Supplied horizontal orthographic camera in a metric XZ frame. Positive image
 * U projects cos(azimuth) X + sin(azimuth) Z; positive image V projects
 * negative Y. Pixel centres have half-integer coordinates.
 */
export interface IAutoMovieRecoveryImageCamera {
  /**
   * Horizontal orthographic projection; perspective and distortion are
   * unsupported.
   */
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
