import type { IAutoMovieRecoveryImageCamera } from "@automovie/interface";

/**
 * One fixed P6 image file and its supplied orthographic camera.
 *
 * @evidence contracts/development/design.md#principled-representation The path and exact-byte SHA-256 bind one fixed P6 image to its supplied orthographic camera.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Per-image file identity and camera metadata belong to the manifest; the Node host owns acquisition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A file hash and supplied camera do not infer calibration or authorize an image-space transformation.
 * @evidence contracts/development/common.md#meaningful-documentation States relative-path resolution, exact-byte identity and supplied camera ownership.
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
