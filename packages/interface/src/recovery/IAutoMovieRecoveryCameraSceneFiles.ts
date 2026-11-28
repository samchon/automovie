import type {
  IAutoMovieRecoveryCameraFile,
  IAutoMovieRecoveryCameraSceneInput,
} from "..";

/**
 * Manifest for the Node `cameras scene` command. It identifies fixed P6 sRGB
 * captures, supplied corrected camera charts, and the resident acquisition and
 * fitting limits.
 */
export interface IAutoMovieRecoveryCameraSceneFiles {
  /** File manifest tag checked by `cameras scene`. */
  schema: "automovie-recovery-camera-scene-files-v1";

  /** P6 binary sRGB RGB8 codec tag. */
  encoding: "ppm-srgb-rgb8-v1";

  /**
   * Resident metadata, policies and budgets. The host fills in decoded `views`
   * from the manifest.
   */
  capture: Omit<IAutoMovieRecoveryCameraSceneInput, "views">;

  /** Positive per-image ceiling on bytes consumed in the P6 header. */
  maxHeaderBytes: number;

  /**
   * Fixed captures in source order, from three through the declared view cap.
   * The first two form the seed.
   */
  views: IAutoMovieRecoveryCameraFile[];
}
