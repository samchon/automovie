import type {
  IAutoMovieRecoveryCameraFile,
  IAutoMovieRecoveryCameraPairInput,
} from "..";

/**
 * Manifest for the Node `cameras estimate` command. Supply two ordered P6 sRGB
 * captures, their corrected charts, and the resident pair controls.
 */
export interface IAutoMovieRecoveryCameraFiles {
  /** File manifest schema for the calibrated camera pair. */
  schema: "automovie-recovery-camera-files-v1";

  /** Fixed P6 sRGB RGB8 encoding accepted by the loader. */
  encoding: "ppm-srgb-rgb8-v1";

  /**
   * Resident scene metadata, pair policy and budget. The host fills in the
   * decoded views.
   */
  capture: Omit<IAutoMovieRecoveryCameraPairInput, "views">;

  /** Positive per-image P6 header byte ceiling. */
  maxHeaderBytes: number;

  /**
   * Exactly two ordered fixed captures. The first view is the seed reference
   * camera.
   */
  views: IAutoMovieRecoveryCameraFile[];
}
