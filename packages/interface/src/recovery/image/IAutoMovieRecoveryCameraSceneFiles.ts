import type {
  IAutoMovieRecoveryCameraFile,
  IAutoMovieRecoveryCameraSceneInput,
} from "../../index";

/** Fixed-byte calibrated image set for the Node cameras scene command. */
export interface IAutoMovieRecoveryCameraSceneFiles {
  /** Versioned bounded image-set acquisition manifest. */
  schema: "automovie-recovery-camera-scene-files-v1";

  /** Exact sRGB RGB8 P6 variation without implicit chart correction. */
  encoding: "ppm-srgb-rgb8-v1";

  /** Closed resident metadata/policy/budgets; the host supplies decoded views. */
  capture: Omit<IAutoMovieRecoveryCameraSceneInput, "views">;

  /** Positive per-source P6 header-byte ceiling. */
  maxHeaderBytes: number;

  /**
   * Fixed source set, bounded by capture.budget.maxViews; first two are the
   * seed.
   */
  views: IAutoMovieRecoveryCameraFile[];
}
