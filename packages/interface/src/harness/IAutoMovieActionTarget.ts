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
 * @author Samchon
 */
export type IAutoMovieActionTarget =
  | IAutoMovieNodeTarget
  | IAutoMovieBoneTarget
  | IAutoMoviePointTarget
  | IAutoMovieGroupTarget
  | IAutoMovieDirectionTarget
  | IAutoMovieOffscreenTarget;
