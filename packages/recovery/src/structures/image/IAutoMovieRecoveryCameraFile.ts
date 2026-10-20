import type { IAutoMovieRecoveryCameraCalibration } from "@automovie/interface/recovery";

/**
 * One fixed-byte camera image declared by the Node acquisition manifest.
 *
 * @evidence contracts/common.md#principled-implementation A declared path and exact byte hash bind acquisition to one supplied pixel calibration; prior pixel transformations remain asserted provenance.
 * @evidence contracts/common.md#clear-and-simple-design The file record owns acquisition metadata while the resident view owns borrowed decoded bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No directory discovery, guessed camera, changed image chart or unverified hash supplies an observation.
 * @evidence contracts/common.md#meaningful-documentation Members state relative path resolution, hash syntax, decoding history and supplied calibration ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no reading, hashing or decoding.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record defines no cache or shared acquisition effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The Node host owns file descriptors and decoded arrays; this declaration acquires no resource.
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
