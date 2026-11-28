import type { IAutoMovieRecoveryCameraCalibration } from "..";

/**
 * Detached identity and supplied calibration of one admitted camera capture.
 * Its position in the enclosing evidence preserves the original source order.
 */
export interface IAutoMovieRecoveryCameraSource {
  /** Unique supplied capture ID. */
  id: string;

  /**
   * Lowercase SHA-256 of the original encoded image bytes, asserted by the
   * resident caller or verified by the file host.
   */
  sourceSha256: string;

  /**
   * Declared decoding, orientation, crop and correction history of the chart
   * used by the detector.
   */
  pixelProvenance: string;

  /** Original resident chart width in pixels. */
  width: number;

  /** Original resident chart height in pixels. */
  height: number;

  /**
   * Supplied corrected pinhole calibration and optional asserted uncertainty
   * for this chart.
   */
  camera: IAutoMovieRecoveryCameraCalibration;
}
