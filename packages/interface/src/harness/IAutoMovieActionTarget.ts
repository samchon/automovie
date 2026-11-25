import type { IAutoMovieBoneTarget } from "./IAutoMovieBoneTarget";
import type { IAutoMovieDirectionTarget } from "./IAutoMovieDirectionTarget";
import type { IAutoMovieGroupTarget } from "./IAutoMovieGroupTarget";
import type { IAutoMovieNodeTarget } from "./IAutoMovieNodeTarget";
import type { IAutoMovieOffscreenTarget } from "./IAutoMovieOffscreenTarget";
import type { IAutoMoviePointTarget } from "./IAutoMoviePointTarget";

/**
 * Where an action points. Prefer a node identity when the target is staged;
 * whether it follows live motion depends on the consuming verb and supplied
 * host resolver, rather than on this union.
 *
 * `node`, `point`, and `group` resolve to one world point through
 * `resolveTargetPoint`; `bone` needs a rigged staged actor and is sampled on
 * the shot clock. The relative kinds, {@link IAutoMovieDirectionTarget} and
 * {@link IAutoMovieOffscreenTarget}, are meant for goals such as "walk off to
 * the left" that need no invented coordinates, but no engine path resolves them
 * yet: a `locomote` toward one steps in place, and every other verb refuses it
 * because it names no place.
 */
export type IAutoMovieActionTarget =
  | IAutoMovieNodeTarget
  | IAutoMovieBoneTarget
  | IAutoMoviePointTarget
  | IAutoMovieGroupTarget
  | IAutoMovieDirectionTarget
  | IAutoMovieOffscreenTarget;
