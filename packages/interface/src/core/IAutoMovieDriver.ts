import { IAutoMovieAimDriver } from "./IAutoMovieAimDriver";
import { IAutoMovieCopyDriver } from "./IAutoMovieCopyDriver";
import { IAutoMovieDrivenDriver } from "./IAutoMovieDrivenDriver";
import { IAutoMovieIKDriver } from "./IAutoMovieIKDriver";
import { IAutoMovieParentDriver } from "./IAutoMovieParentDriver";
import { IAutoMovieSpringDriver } from "./IAutoMovieSpringDriver";

/**
 * A driver: a relationship that computes channels from other channels, the
 * joint-dependency layer that turns a bare imported model into a rig. The
 * engine resolves drivers in dependency order (a cached topological DAG) each
 * frame, after sampling tracks and before clamping constraints. This is the
 * layer glTF and USD deliberately omit (they bake the result); automovie keeps
 * it live, which is what makes it an engine rather than a model holder.
 *
 * Discriminated on `type`. The taxonomy is reduced from the established DCC
 * constraint/driver set (Blender/Maya): copy, aim, ik, parent, driven, spring.
 * (A pure value limit is a {@link IAutoMovieChannelLimit}, not a driver:
 * computation and restriction are kept separate.)
 *
 * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `IAutoMovieDriver` as the portable data boundary for the motion channel dependencies requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `IAutoMovieDriver` for the performance motion clip keytime interpolation system contract.
 * @author Samchon
 */
export type IAutoMovieDriver =
  | IAutoMovieCopyDriver
  | IAutoMovieAimDriver
  | IAutoMovieIKDriver
  | IAutoMovieParentDriver
  | IAutoMovieDrivenDriver
  | IAutoMovieSpringDriver;
