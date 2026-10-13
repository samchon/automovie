import { IAutoMovieAimDriver } from "./IAutoMovieAimDriver";
import { IAutoMovieCopyDriver } from "./IAutoMovieCopyDriver";
import { IAutoMovieDrivenDriver } from "./IAutoMovieDrivenDriver";
import { IAutoMovieIKDriver } from "./IAutoMovieIKDriver";
import { IAutoMovieParentDriver } from "./IAutoMovieParentDriver";
import { IAutoMovieSpringDriver } from "./IAutoMovieSpringDriver";

/**
 * A driver: a relationship that computes channels from other channels, the
 * joint-dependency layer that turns a bare imported model into a rig. glTF and
 * USD omit this layer and bake its result; automovie keeps it live, which is
 * what makes it an engine rather than a model holder.
 *
 * `resolveFrame` runs drivers in two passes every frame, profile-bound drivers
 * before the caller's own. `copy` and `driven` are channel-space: they are
 * topologically sorted afresh each frame and applied to the sampled channels
 * before limits clamp, and a dependency cycle among them throws. `aim`,
 * `parent` and `ik` are world-space: they run in list order after the hierarchy
 * is composed, so limits never clamp their results. `spring` steps last, and
 * only when the caller supplies spring state; otherwise it is returned in
 * `deferredDrivers`, as is a `twoBone` IK whose chain is not three nodes. An
 * unknown `type` throws.
 *
 * Discriminated on `type`. The taxonomy is reduced from the established DCC
 * constraint and driver set (Blender, Maya): copy, aim, ik, parent, driven,
 * spring. A pure value limit is an {@link IAutoMovieChannelLimit}, not a
 * driver, so computation and restriction stay separate.
 *
 * @evidence contracts/common.md#principled-implementation `resolveDrivers` partitions by `type`, orders copy and driven drivers by a depth-first topological sort over the channel keys they read and write, and `resolveWorldDrivers` then applies aim, parent and solvable IK in list order on composed world matrices, deferring the rest.
 * @evidence contracts/common.md#clear-and-simple-design A six-member union discriminated on `type`, where each member carries only its own solve's inputs and the pass a driver runs in follows from its type rather than from a flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A driver the frame cannot solve is returned in `deferredDrivers` rather than dropped, an unknown type throws, and a cycle throws instead of being broken at an arbitrary edge.
 * @evidence contracts/common.md#meaningful-documentation States the two passes and their order relative to limits and composition, the profile-first ordering, which drivers are deferred and when, the throws, and why limits are not drivers.
 * @author Samchon
 */
export type IAutoMovieDriver =
  | IAutoMovieCopyDriver
  | IAutoMovieAimDriver
  | IAutoMovieIKDriver
  | IAutoMovieParentDriver
  | IAutoMovieDrivenDriver
  | IAutoMovieSpringDriver;
