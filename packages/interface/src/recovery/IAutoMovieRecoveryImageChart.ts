import type { IAutoMovieRecoveryImageCamera } from "./IAutoMovieRecoveryImageCamera";

/**
 * Byte provenance and supplied pixel chart shared by captures and observations.
 * The record describes current pixels; it does not authorize an unstated crop or transform.
 *
 * @evidence contracts/common.md#principled-implementation Stable byte identity, current dimensions and a supplied metric camera preserve the same pixel chart when RGB data becomes support observations.
 * @evidence contracts/common.md#clear-and-simple-design One shared interface owns common view metadata while capture bytes and measured rows remain distinct extensions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Provenance is explicit rather than guessed from a filename, inferred camera or specimen identity.
 * @evidence contracts/common.md#meaningful-documentation States unique view identity, SHA-256 responsibility, external pixel-transform history and positive integer dimensions.
 */
export interface IAutoMovieRecoveryImageChart {
  /** Capture/camera identity, unique within its containing view population. */
  id: string;

  /** Original-byte SHA-256, asserted by resident callers and verified by the file host. */
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
