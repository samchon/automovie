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
 * `node`, `point` and `group` resolve to one world point; `bone` needs a rigged
 * staged actor and is sampled on the shot clock. The relative kinds are not
 * resolved by any engine path yet: a `locomote` toward one steps in place, and
 * every other verb refuses it because it names no place.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `kind` that `resolveTargetPoint` turns into one world point for `node`, `point` and `group` (a centroid), with `bone` sampled from a rigged actor's pose; `direction` and `offscreen` have no resolver yet, an unresolved limitation.
 * @evidence contracts/common.md#clear-and-simple-design Six target shapes in one union so every verb that points somewhere takes the same type; formation framing and live-bone lookup stay in the engine rather than in the target records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No target kind is special-cased per verb except the documented formation rule: only a camera's frame or focus subject may name a formation in a group target.
 * @evidence contracts/common.md#meaningful-documentation States the preference among target kinds, which kinds resolve to a point, what `bone` requires, and that the relative kinds are not yet realized.
 * @author Samchon
 */
export type IAutoMovieActionTarget =
  | IAutoMovieNodeTarget
  | IAutoMovieBoneTarget
  | IAutoMoviePointTarget
  | IAutoMovieGroupTarget
  | IAutoMovieDirectionTarget
  | IAutoMovieOffscreenTarget;
