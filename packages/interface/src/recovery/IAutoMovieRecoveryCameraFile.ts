import type { IAutoMovieRecoveryCameraCalibration } from "..";

/**
 * Fixed encoded image entry for the file-backed calibrated camera commands. It
 * binds the path and byte hash to the supplied pixel chart.
 */
export interface IAutoMovieRecoveryCameraFile {
  /** Nonblank capture identity, unique within the resident camera request. */
  id: string;

  /** Encoded image path resolved from the manifest directory. */
  path: string;

  /** Expected lowercase SHA-256 of the encoded image bytes. */
  sha256: string;

  /**
   * Declared decode, orientation, crop and correction history for this pixel
   * chart.
   */
  pixelProvenance: string;

  /** Supplied corrected pinhole calibration for the decoded chart. */
  camera: IAutoMovieRecoveryCameraCalibration;
}
