import type {
  IAutoMovieRecoveryImageFile,
  IAutoMovieRecoveryImageInput,
} from "..";

/**
 * Describe one same-object file capture using fixed P6 sRGB RGB8 bytes and
 * supplied horizontal orthographic cameras. List at least three views in
 * capture order. The host verifies each original byte hash before decoding.
 */
export interface IAutoMovieRecoveryImageFiles {
  /** Interpret the listed P6 RGB8 bytes as sRGB. */
  encoding: "ppm-srgb-rgb8";

  /** Shared object, frame, background policy and budgets for the listed views. */
  capture: Omit<IAutoMovieRecoveryImageInput, "views">;

  /** Positive safe integer byte limit for each P6 header. */
  maxHeaderBytes: number;

  /** Ordered file entries for at least three calibrated views of the object. */
  views: IAutoMovieRecoveryImageFile[];
}
