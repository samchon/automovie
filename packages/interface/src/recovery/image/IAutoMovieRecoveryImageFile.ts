import type { IAutoMovieRecoveryImageCamera } from "../../index";

/** One fixed P6 image file and its supplied orthographic camera. */
export interface IAutoMovieRecoveryImageFile {
  /** Stable identity within this saved publication. */
  id: string;

  /**
   * Image path resolved relative to the containing manifest; absolute paths are
   * also accepted.
   */
  path: string;

  /** SHA-256 of the exact published or acquired bytes. */
  sha256: string;

  /** Supplied fixed camera chart associated with this image. */
  camera: IAutoMovieRecoveryImageCamera;
}
