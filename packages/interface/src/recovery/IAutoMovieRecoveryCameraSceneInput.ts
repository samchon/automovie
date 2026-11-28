import type { IAutoMovieRecoveryCameraMapInput } from "./IAutoMovieRecoveryCameraMapInput";
import type { IAutoMovieRecoveryCameraSceneBudget } from "./IAutoMovieRecoveryCameraSceneBudget";

/**
 * Fixed RGB8 views for building one incremental sparse component under supplied
 * corrected pinhole calibration. Views zero and one define the seed. Keep the
 * borrowed rasters unchanged until estimation returns.
 */
export interface IAutoMovieRecoveryCameraSceneInput extends Omit<
  IAutoMovieRecoveryCameraMapInput,
  "schema" | "views" | "budget"
> {
  /** Resident schema for incremental camera-scene estimation. */
  schema: "automovie-recovery-camera-scene-input-v1";

  /**
   * At least three fixed calibrated views with unique IDs, up to the scene's
   * view cap. The first two form the ordered seed.
   */
  views: IAutoMovieRecoveryCameraMapInput["views"];

  /**
   * Limits for admitted images and per-fit work, plus cumulative registration
   * work and simultaneous linear scalar slots.
   */
  budget: IAutoMovieRecoveryCameraSceneBudget;
}
