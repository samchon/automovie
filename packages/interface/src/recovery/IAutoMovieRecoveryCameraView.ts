import type { IAutoMovieRecoveryCameraCalibration } from "./IAutoMovieRecoveryCameraCalibration";

/** Borrowed fixed RGB8 pixels and their source/calibration identity. */
export interface IAutoMovieRecoveryCameraView {
  /** Unique image/camera identity. */
  id: string;

  /**
   * Caller-asserted lowercase SHA-256 of fixed source bytes; decoding/capture
   * derivations belong to pixelProvenance. File hosts verify acquired inputs.
   */
  sourceSha256: string;

  /**
   * Explicit decoding, orientation, crop and correction history of this exact
   * chart.
   */
  pixelProvenance: string;

  /** Positive integer width of the calibrated resident chart. */
  width: number;

  /** Positive integer height of the calibrated resident chart. */
  height: number;

  /**
   * Exactly 3_width_height row-major unsigned sRGB bytes; caller keeps these
   * unchanged, including from other workers, until the synchronous operation
   * returns.
   */
  rgb8: Uint8Array;

  /** Caller-supplied lens calibration in this exact pixel-centre chart. */
  camera: IAutoMovieRecoveryCameraCalibration;
}
