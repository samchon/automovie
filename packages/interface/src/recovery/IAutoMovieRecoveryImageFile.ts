import type { IAutoMovieRecoveryImageCamera } from "..";

/**
 * Identify one fixed P6 image and its supplied horizontal orthographic camera.
 * The host checks the original file bytes before decoding them for the named
 * capture.
 */
export interface IAutoMovieRecoveryImageFile {
  /** View identity, unique in the containing capture. */
  id: string;

  /**
   * Image path. Resolve relative paths against the manifest directory. Absolute
   * paths are accepted.
   */
  path: string;

  /** SHA-256 of the exact original image bytes, as 64 hexadecimal characters. */
  sha256: string;

  /** Supplied horizontal orthographic chart calibrated for the decoded pixels. */
  camera: IAutoMovieRecoveryImageCamera;
}
