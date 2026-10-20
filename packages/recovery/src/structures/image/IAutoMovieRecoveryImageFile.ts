import type { IAutoMovieRecoveryImageCamera } from "@automovie/interface/recovery";

/**
 * One fixed P6 image file and its supplied orthographic camera.
 *
 * @evidence contracts/common.md#principled-implementation The path and exact-byte SHA-256 bind one fixed P6 image to its supplied orthographic camera.
 * @evidence contracts/common.md#clear-and-simple-design Per-image file identity and camera metadata belong to the manifest; the Node host owns acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A file hash and supplied camera do not infer calibration or authorize an image-space transformation.
 * @evidence contracts/common.md#meaningful-documentation States relative-path resolution, exact-byte identity and supplied camera ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data remain caller-owned.
 */
export interface IAutoMovieRecoveryImageFile {
  /** Stable identity within this saved publication. */
  id: string;

  /** Image path resolved relative to the containing manifest; absolute paths are also accepted. */
  path: string;

  /** SHA-256 of the exact published or acquired bytes. */
  sha256: string;

  /** Supplied fixed camera chart associated with this image. */
  camera: IAutoMovieRecoveryImageCamera;
}
