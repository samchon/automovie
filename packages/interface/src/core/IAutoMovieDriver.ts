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
 * @author Samchon
 */
export type IAutoMovieDriver =
  | IAutoMovieCopyDriver
  | IAutoMovieAimDriver
  | IAutoMovieIKDriver
  | IAutoMovieParentDriver
  | IAutoMovieDrivenDriver
  | IAutoMovieSpringDriver;
