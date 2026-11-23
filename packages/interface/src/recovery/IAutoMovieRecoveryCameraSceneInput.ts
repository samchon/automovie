import type { IAutoMovieRecoveryCameraMapInput } from "./IAutoMovieRecoveryCameraMapInput";
import type { IAutoMovieRecoveryCameraSceneBudget } from "./IAutoMovieRecoveryCameraSceneBudget";

/**
 * Fixed calibrated image set for one bounded incremental sparse component.
 * Views zero/one are the explicit seed. Later views are candidates selected by
 * existing-map support and stable IDs, without a supplied trajectory or poses.
 * Supplied corrected pinhole calibration and rigid geometry remain assertions.
 */
export interface IAutoMovieRecoveryCameraSceneInput extends Omit<
  IAutoMovieRecoveryCameraMapInput,
  "schema" | "views" | "budget"
> {
  /** Versioned variable-view calibrated sparse-scene request. */
  schema: "automovie-recovery-camera-scene-input-v1";

  /**
   * At least three unique fixed images; keep borrowed RGB bytes unchanged until
   * return.
   */
  views: IAutoMovieRecoveryCameraMapInput["views"];

  /** Explicit per-fit, aggregate and retained scalar-slot limits. */
  budget: IAutoMovieRecoveryCameraSceneBudget;
}
