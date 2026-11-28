/**
 * Describe a supplied horizontal orthographic camera in the common millimetre
 * frame. Positive image U projects cos(azimuth) X + sin(azimuth) Z, and
 * positive image V projects negative Y. The center of pixel (column, row)
 * lies at (column + 0.5, row + 0.5).
 */
export interface IAutoMovieRecoveryImageCamera {
  /** Supported horizontal orthographic projection model. */
  type: "horizontal-orthographic";

  /** Source of calibration. Supply the settings for the current raster. */
  calibration: "supplied";

  /** Angle of positive image U in radians, measured from +X toward +Z. */
  azimuthRadians: number;

  /** Finite positive millimetres per pixel along both square-pixel axes. */
  pixelPitchMm: number;

  /** Pixel-edge coordinates [u0, v0] of the common metric origin. */
  principalPointPx: [number, number];
}
