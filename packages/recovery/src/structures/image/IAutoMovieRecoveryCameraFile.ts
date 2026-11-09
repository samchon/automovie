import type { IAutoMovieRecoveryCameraCalibration } from "@automovie/interface";

/**
 * One fixed-byte camera image declared by the Node acquisition manifest.
 *
 * @evidence contracts/development/design.md#principled-representation A declared path and exact byte hash bind acquisition to one supplied pixel calibration; prior pixel transformations remain asserted provenance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The file record owns acquisition metadata while the resident view owns borrowed decoded bytes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No directory discovery, guessed camera, changed image chart or unverified hash supplies an observation.
 * @evidence contracts/development/common.md#meaningful-documentation Members state relative path resolution, hash syntax, decoding history and supplied calibration ownership.
 */
export interface IAutoMovieRecoveryCameraFile {
  /** Unique resident acquisition identity. */
  id: string;

  /** Image path relative to its manifest, or an explicitly supplied absolute path. */
  path: string;

  /** Lowercase SHA-256 of the exact acquired P6 bytes. */
  sha256: string;

  /** Declared capture/decoding history, including original hashes of a lossless derivative. */
  pixelProvenance: string;

  /** Corrected pinhole intrinsics in this exact unchanged integer-pixel-centre chart. */
  camera: IAutoMovieRecoveryCameraCalibration;
}
