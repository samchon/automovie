import type {
  IAutoMovieRecoveryCameraFile,
  IAutoMovieRecoveryCameraPairInput,
} from "..";

/**
 * Fixed-byte P6 sRGB file acquisition for the calibrated camera-pair operation.
 * Paths resolve relative to this manifest. Decoding preserves every pixel and
 * applies no rotation, crop, resize, rectification or lens correction; prior
 * capture/decoding derivations belong to each explicit provenance record.
 */
export interface IAutoMovieRecoveryCameraFiles {
  /** Version of the fixed-byte two-view camera manifest. */
  schema: "automovie-recovery-camera-files-v1";

  /**
   * Explicit RGB8 sRGB P6 variation; other capture formats require a recorded
   * unchanged-chart decoding step.
   */
  encoding: "ppm-srgb-rgb8-v1";

  /**
   * Resident metadata, declared method and finite budgets; views are acquired
   * from the files below.
   */
  capture: Omit<IAutoMovieRecoveryCameraPairInput, "views">;

  /** Positive maximum scanned P6 header bytes per image. */
  maxHeaderBytes: number;

  /** Exactly two explicit views in the order defining the first-camera gauge. */
  views: IAutoMovieRecoveryCameraFile[];
}
