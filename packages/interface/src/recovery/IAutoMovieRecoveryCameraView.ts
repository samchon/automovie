import type { IAutoMovieRecoveryCameraCalibration } from "./IAutoMovieRecoveryCameraCalibration";

/**
 * One borrowed row-major sRGB RGB8 raster with source identity, provenance and
 * its supplied corrected pinhole chart. Keep the bytes unchanged until
 * synchronous estimation returns.
 */
export interface IAutoMovieRecoveryCameraView {
  /** Nonblank source identity, unique within the request. */
  id: string;

  /**
   * Caller-asserted lowercase SHA-256 of the encoded source bytes. File hosts
   * verify the digest before decoding.
   */
  sourceSha256: string;

  /**
   * Nonblank source description of decoding, orientation, cropping and
   * correction for the resident chart.
   */
  pixelProvenance: string;

  /** Positive safe integer pixel width of the corrected chart. */
  width: number;

  /** Positive safe integer pixel height of the corrected chart. */
  height: number;

  /** Borrowed row-major unsigned sRGB bytes with exactly three bytes per pixel. */
  rgb8: Uint8Array;

  /**
   * Supplied corrected pinhole calibration in the same resident pixel-center
   * chart.
   */
  camera: IAutoMovieRecoveryCameraCalibration;
}
