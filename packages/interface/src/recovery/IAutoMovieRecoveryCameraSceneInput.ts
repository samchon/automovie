import type { IAutoMovieRecoveryCameraMapInput } from "./IAutoMovieRecoveryCameraMapInput";
import type { IAutoMovieRecoveryCameraSceneBudget } from "./IAutoMovieRecoveryCameraSceneBudget";

/**
 * Fixed calibrated image set for one bounded incremental sparse component.
 * Views zero/one are the explicit seed. Later views are candidates selected by
 * existing-map support and stable IDs, without a supplied trajectory or poses.
 * Supplied corrected pinhole calibration and rigid geometry remain assertions.
 *
 * @evidence contracts/common.md#principled-implementation Existing fixed RGB/calibration, seed policy and separate pixel-reprojection map policy remain unchanged; the scene budget bounds incremental registration and full global track admission.
 * @evidence contracts/common.md#clear-and-simple-design A separate versioned scene schema preserves the exact-three-view map contract while reusing its established image and numerical inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reference poses, authored feature tracks, filename trajectory, learned completion or implicit physical scale enters this automatic scene input.
 * @evidence contracts/common.md#meaningful-documentation States explicit seed ordering, candidate-set semantics, stable borrowed pixels, caller premises and separate repeated-work ceilings.
 */
export interface IAutoMovieRecoveryCameraSceneInput extends Omit<
  IAutoMovieRecoveryCameraMapInput,
  "schema" | "views" | "budget"
> {
  /** Versioned variable-view calibrated sparse-scene request. */
  schema: "automovie-recovery-camera-scene-input-v1";

  /** At least three unique fixed images; keep borrowed RGB bytes unchanged until return. */
  views: IAutoMovieRecoveryCameraMapInput["views"];

  /** Explicit per-fit, aggregate and retained scalar-slot limits. */
  budget: IAutoMovieRecoveryCameraSceneBudget;
}
