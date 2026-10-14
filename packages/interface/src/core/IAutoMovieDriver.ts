import { IAutoMovieAimDriver } from "./IAutoMovieAimDriver";
import { IAutoMovieCopyDriver } from "./IAutoMovieCopyDriver";
import { IAutoMovieDrivenDriver } from "./IAutoMovieDrivenDriver";
import { IAutoMovieIKDriver } from "./IAutoMovieIKDriver";
import { IAutoMovieParentDriver } from "./IAutoMovieParentDriver";
import { IAutoMovieSpringDriver } from "./IAutoMovieSpringDriver";

/**
 * A relationship that computes channel values or world transforms from other scene inputs.
 *
 * resolveFrame places profile descriptors before direct descriptors, then dependency-sorts copy/driven operations before clamping sampled values. Dependencies can move a direct producer ahead of a profile consumer; reciprocal driver cycles throw, while a driver's own input/output identity follows the explicit one-step policy. Aim, parent and IK run in combined list order after composition, and springs step afterward only with supplied state. Otherwise springs and non-three-node twoBone descriptors remain deferred. Unknown driver types throw.
 *
 * Discriminated on type: copy, aim, IK, parent, driven and spring. IAutoMovieChannelLimit separately expresses component restriction.
 *
 * @evidence contracts/common.md#principled-implementation `resolveDrivers` partitions by `type`, orders copy and driven drivers by a depth-first topological sort over the channel keys they read and write, and `resolveWorldDrivers` then applies aim, parent and solvable IK in list order on composed world matrices, deferring the rest.
 * @evidence contracts/common.md#clear-and-simple-design A six-member union discriminated on `type`, where each member carries only its own solve's inputs and the pass a driver runs in follows from its type rather than from a flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supported world/stateful descriptors that this pass does not execute remain deferred; unknown driver types and reciprocal value-driver cycles throw. A driver's own input/output identity is excluded from dependency edges under the existing one-step policy.
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
