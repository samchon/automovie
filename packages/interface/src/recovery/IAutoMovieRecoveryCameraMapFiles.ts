import type {
  IAutoMovieRecoveryCameraFile,
  IAutoMovieRecoveryCameraMapInput,
} from "..";

/**
 * File manifest for the Node `cameras map` command. It identifies three fixed
 * P6 sRGB captures in source order. The host resolves each path from the
 * manifest, verifies the encoded bytes, decodes the supplied chart, and calls
 * resident map estimation.
 */
export interface IAutoMovieRecoveryCameraMapFiles {
  /** Version of the three-file map acquisition manifest. */
  schema: "automovie-recovery-camera-map-files-v1";

  /** P6 binary sRGB RGB8 encoding accepted by the Node loader. */
  encoding: "ppm-srgb-rgb8-v1";

  /**
   * Exact resident metadata, seed and map policies, and budgets. The loader
   * builds the resident views from `views`.
   */
  capture: Omit<IAutoMovieRecoveryCameraMapInput, "views">;

  /** Positive per-image bound on P6 header bytes consumed by the decoder. */
  maxHeaderBytes: number;

  /**
   * Exactly three fixed captures, in source order. Entries zero and one form
   * the seed.
   */
  views: IAutoMovieRecoveryCameraFile[];
}
