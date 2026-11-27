import type { IAutoMovieRecoveryCameraCalibration } from "..";

/** One fixed-byte camera image declared by the Node acquisition manifest. */
export interface IAutoMovieRecoveryCameraFile {
  /** Unique resident acquisition identity. */
  id: string;

  /**
   * Image path relative to its manifest, or an explicitly supplied absolute
   * path.
   */
  path: string;

  /** Lowercase SHA-256 of the exact acquired P6 bytes. */
  sha256: string;

  /**
   * Declared capture/decoding history, including original hashes of a lossless
   * derivative.
   */
  pixelProvenance: string;

  /**
   * Corrected pinhole intrinsics in this exact unchanged integer-pixel-centre
   * chart.
   */
  camera: IAutoMovieRecoveryCameraCalibration;
}
