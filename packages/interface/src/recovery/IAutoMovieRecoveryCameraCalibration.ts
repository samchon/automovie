/**
 * Supplied pinhole intrinsics for the resident corrected pixel-center chart.
 * Columns increase rightward, and rows increase downward. The caller supplies
 * any calibration uncertainty.
 */
export interface IAutoMovieRecoveryCameraCalibration {
  /** Perspective pinhole camera model. */
  type: "pinhole";

  /** Identifies the calibration as supplied independently of pose estimation. */
  calibration: "supplied-intrinsics";

  /**
   * Caller assertion that lens distortion was corrected in the resident image
   * chart.
   */
  distortion: "caller-corrected";

  /** Finite positive horizontal and vertical focal lengths [fx, fy], in pixels. */
  focalPx: [number, number];

  /**
   * Finite coefficient K(0,1) in pixels, for the upper-triangular pinhole
   * matrix.
   */
  skewPx: number;

  /**
   * Finite [column, row] principal-point coordinates in the resident pixel
   * chart.
   */
  principalPointPx: [number, number];

  /** Nonnegative finite supplied uncertainty in pixels, or null when unknown. */
  uncertaintyPx: number | null;
}
