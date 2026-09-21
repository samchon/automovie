import { IAutoMovieBoneTarget } from "./IAutoMovieBoneTarget";
import { IAutoMovieDirectionTarget } from "./IAutoMovieDirectionTarget";
import { IAutoMovieGroupTarget } from "./IAutoMovieGroupTarget";
import { IAutoMovieNodeTarget } from "./IAutoMovieNodeTarget";
import { IAutoMovieOffscreenTarget } from "./IAutoMovieOffscreenTarget";
import { IAutoMoviePointTarget } from "./IAutoMoviePointTarget";

/**
 * Where an action points. Prefer a {@link IAutoMovieNodeTarget} (so the engine
 * resolves live world positions of moving actors) over a literal
 * {@link IAutoMoviePointTarget}; use {@link IAutoMovieDirectionTarget} /
 * {@link IAutoMovieOffscreenTarget} for relative goals ("walk off to the left")
 * so the model never has to invent world coordinates.
 *
 * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-target-refusal Exposes `IAutoMovieActionTarget` as the portable data boundary for the camera target refusal requirement.
 * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-diagnostics-refusal Types `IAutoMovieActionTarget` for the clv focus diagnostics refusal system contract.
 * @author Samchon
 */
export type IAutoMovieActionTarget =
  | IAutoMovieNodeTarget
  | IAutoMovieBoneTarget
  | IAutoMoviePointTarget
  | IAutoMovieGroupTarget
  | IAutoMovieDirectionTarget
  | IAutoMovieOffscreenTarget;
