import type { IAutoMovieRecoveryImageCamera } from "./IAutoMovieRecoveryImageCamera";

/**
 * Byte provenance and supplied pixel chart shared by captures and observations.
 * The record describes current pixels; it does not authorize an unstated crop
 * or transform.
 */
export interface IAutoMovieRecoveryImageChart {
  /** Capture/camera identity, unique within its containing view population. */
  id: string;

  /**
   * Original-byte SHA-256, asserted by resident callers and verified by the
   * file host.
   */
  sourceSha256: string;

  /** Producer-declared external orientation, crop or rectification history. */
  pixelProvenance: string;

  /** Positive integer width of the current image, pixels. */
  width: number;

  /** Positive integer height of the current image, pixels. */
  height: number;

  /** Supplied camera calibrated for these exact current pixel coordinates. */
  camera: IAutoMovieRecoveryImageCamera;
}
