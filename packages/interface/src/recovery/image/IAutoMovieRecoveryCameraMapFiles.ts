import type {
  IAutoMovieRecoveryCameraFile,
  IAutoMovieRecoveryCameraMapInput,
} from "../../index";

/**
 * Three fixed-byte sRGB P6 images for the Node calibrated-map command. Paths
 * are relative to the manifest; decoding preserves the supplied chart.
 */
export interface IAutoMovieRecoveryCameraMapFiles {
  /** Versioned three-view map acquisition manifest. */
  schema: "automovie-recovery-camera-map-files-v1";

  /** Exact sRGB RGB8 P6 variation, with no implicit camera correction. */
  encoding: "ppm-srgb-rgb8-v1";

  /** Closed resident metadata/policy/budgets; the host supplies views below. */
  capture: Omit<IAutoMovieRecoveryCameraMapInput, "views">;

  /** Positive maximum P6 header bytes per image. */
  maxHeaderBytes: number;

  /** Exactly three source-order images; the first two define the seed. */
  views: IAutoMovieRecoveryCameraFile[];
}
