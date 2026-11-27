import type { IAutoMovieRecoveryCameraCalibration } from "..";

/** Identity and caller-supplied calibration of one observed image. */
export interface IAutoMovieRecoveryCameraSource {
  /** Unique acquisition identity in first/second order. */
  id: string;

  /**
   * Caller-asserted fixed source-byte hash; Node hosts verify their acquired
   * source inputs.
   */
  sourceSha256: string;

  /**
   * Declared decoding, crop, orientation and correction history for the current
   * chart.
   */
  pixelProvenance: string;

  /** Resident integer-centre dimensions in pixels. */
  width: number;

  /** Resident integer-centre height in pixels. */
  height: number;

  /**
   * Supplied corrected pinhole intrinsics, including nullable asserted
   * uncertainty.
   */
  camera: IAutoMovieRecoveryCameraCalibration;
}
