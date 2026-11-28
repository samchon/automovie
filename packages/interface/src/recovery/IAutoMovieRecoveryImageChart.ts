import type { IAutoMovieRecoveryImageCamera } from "./IAutoMovieRecoveryImageCamera";

/**
 * Identify one calibrated current image grid and its byte provenance. Width
 * and height are positive safe integer pixel counts. Supply a camera for
 * these exact image coordinates.
 */
export interface IAutoMovieRecoveryImageChart {
  /** Nonempty view identity, unique within the capture or observation. */
  id: string;

  /**
   * SHA-256 of original image bytes, as 64 hexadecimal characters. The file
   * host verifies it before decoding.
   */
  sourceSha256: string;

  /**
   * Nonempty account of any producer orientation, crop or rectification for the
   * current pixels.
   */
  pixelProvenance: string;

  /** Positive safe integer number of columns in the current raster. */
  width: number;

  /** Positive safe integer number of rows in the current raster. */
  height: number;

  /** Supplied camera calibrated for this exact pixel grid. */
  camera: IAutoMovieRecoveryImageCamera;
}
