import { IAutoMovieAimDriver } from "./IAutoMovieAimDriver";
import { IAutoMovieCopyDriver } from "./IAutoMovieCopyDriver";
import { IAutoMovieDrivenDriver } from "./IAutoMovieDrivenDriver";
import { IAutoMovieIKDriver } from "./IAutoMovieIKDriver";
import { IAutoMovieParentDriver } from "./IAutoMovieParentDriver";
import { IAutoMovieSpringDriver } from "./IAutoMovieSpringDriver";

/**
 * A driver: a relationship that computes channels from other channels, the
 * joint-dependency layer that turns a bare imported model into a rig. This is
 * the layer glTF and USD deliberately omit (they bake the result); automovie
 * keeps it live, which is what makes it an engine rather than a model holder.
 *
 * `resolveFrame` runs drivers in two passes every frame, profile-bound drivers
 * before the caller's own. `copy` and `driven` are channel-space: they are
 * topologically sorted afresh each frame and applied to the sampled channels
 * before limits clamp, and a dependency cycle among them throws. `aim`,
 * `parent` and `ik` are world-space: they run in list order after the hierarchy
 * is composed, so limits never clamp their results. `spring` steps last, and
 * only when the caller supplies spring state; otherwise it is returned in
 * `deferredDrivers`, as is a `twoBone` IK whose chain is not three nodes.
 *
 * Discriminated on `type`. The taxonomy is reduced from the established DCC
 * constraint/driver set (Blender/Maya): copy, aim, ik, parent, driven, spring.
 * (A pure value limit is a {@link IAutoMovieChannelLimit}, not a driver:
 * computation and restriction are kept separate.)
 *
 * @evidence contracts/common.md#principled-implementation A union discriminated on `type`; `resolveDrivers` partitions it into channel-space and world-space sets, orders the channel-space set by a depth-first topological sort with gray-node cycle detection, and throws on an unknown type.
 * @evidence contracts/common.md#clear-and-simple-design Each relationship is its own interface carrying only the fields its solver reads, and the union keeps computation apart from restriction by leaving value bounds to `IAutoMovieChannelLimit`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unresolvable drivers are surfaced in `deferredDrivers` rather than dropped; the world-space pass has no dependency sort, so a world driver reading another's output depends on authoring order, an unresolved limitation stated in the prose.
 * @evidence contracts/common.md#meaningful-documentation States which types run in which pass and order, that the channel-space sort is recomputed every frame, when limits apply, the deferral cases, and that profile-bound drivers come first.
 * @author Samchon
 */
export type IAutoMovieDriver =
  | IAutoMovieCopyDriver
  | IAutoMovieAimDriver
  | IAutoMovieIKDriver
  | IAutoMovieParentDriver
  | IAutoMovieDrivenDriver
  | IAutoMovieSpringDriver;
