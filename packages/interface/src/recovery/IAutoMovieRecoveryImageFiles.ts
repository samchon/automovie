import type {
  IAutoMovieRecoveryImageFile,
  IAutoMovieRecoveryImageInput,
} from "..";

/**
 * Fixed-byte file host for the known-camera resident capture contract. Image
 * paths resolve relative to this manifest. The P6 sRGB variation is an explicit
 * acquisition assertion, not a colour-space estimator. Decoding applies no
 * EXIF, crop, resizing, undistortion or image-space camera modification.
 */
export interface IAutoMovieRecoveryImageFiles {
  /**
   * Exact supported byte interpretation; standard BT.709 PPM needs a separately
   * recorded conversion.
   */
  encoding: "ppm-srgb-rgb8";

  /**
   * Resident capture metadata, foreground policy and aggregate observation
   * budgets.
   */
  capture: Omit<IAutoMovieRecoveryImageInput, "views">;

  /** Header scan budget in bytes for each fixed P6 image. */
  maxHeaderBytes: number;

  /**
   * Explicit same-object images and supplied charts, with no directory
   * discovery.
   */
  views: IAutoMovieRecoveryImageFile[];
}
