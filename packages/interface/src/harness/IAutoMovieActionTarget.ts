import { IAutoMovieBoneTarget } from "./IAutoMovieBoneTarget";
import { IAutoMovieDirectionTarget } from "./IAutoMovieDirectionTarget";
import { IAutoMovieGroupTarget } from "./IAutoMovieGroupTarget";
import { IAutoMovieNodeTarget } from "./IAutoMovieNodeTarget";
import { IAutoMovieOffscreenTarget } from "./IAutoMovieOffscreenTarget";
import { IAutoMoviePointTarget } from "./IAutoMoviePointTarget";

/**
 * Where an action points. Prefer a node identity when the target is staged; whether it follows live motion depends on the consuming verb and supplied host resolver, rather than on this union.
 *
 * `node`, `point`, and `group` resolve to one world point through
 * `resolveTargetPoint`; `bone` needs a rigged staged actor and is sampled on
 * the shot clock. The relative kinds, {@link IAutoMovieDirectionTarget} and
 * {@link IAutoMovieOffscreenTarget}, are meant for goals such as "walk off to
 * the left" that need no invented coordinates, but no engine path resolves
 * them yet: a `locomote` toward one steps in place, and every other verb
 * refuses it because it names no place.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `kind`, so `performShot` validates each representation by narrowing and `positionalTargetFault` explains a failed one in terms of the kind the author chose.
 * @evidence contracts/common.md#clear-and-simple-design Six representations cover a staged node, a live bone, a literal point, a group centroid and two relative goals, each in its own record, instead of one record with optional fields whose combinations would need rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Relative targets are not converted to a guessed world point; a locomote toward one steps in place and every other verb refuses it with a located violation, and the gap is stated here.
 * @evidence contracts/common.md#meaningful-documentation States which kind to prefer and why, which kinds resolve to a point and through which function, what a bone target needs, and exactly how the unresolved relative kinds behave per verb.
 * @author Samchon
 */
export type IAutoMovieActionTarget =
  | IAutoMovieNodeTarget
  | IAutoMovieBoneTarget
  | IAutoMoviePointTarget
  | IAutoMovieGroupTarget
  | IAutoMovieDirectionTarget
  | IAutoMovieOffscreenTarget;
