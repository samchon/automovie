import type { IAutoMovieAimDriver } from "./IAutoMovieAimDriver";
import type { IAutoMovieCopyDriver } from "./IAutoMovieCopyDriver";
import type { IAutoMovieDrivenDriver } from "./IAutoMovieDrivenDriver";
import type { IAutoMovieIKDriver } from "./IAutoMovieIKDriver";
import type { IAutoMovieParentDriver } from "./IAutoMovieParentDriver";
import type { IAutoMovieSpringDriver } from "./IAutoMovieSpringDriver";

/**
 * A relationship that computes channel values or world transforms from other
 * scene inputs.
 *
 * ResolveFrame places profile descriptors before direct descriptors, then
 * dependency-sorts copy/driven operations before clamping sampled values.
 * Dependencies can move a direct producer ahead of a profile consumer;
 * reciprocal driver cycles throw, while a driver's own input/output identity
 * follows the explicit one-step policy. Aim, parent and IK run in combined list
 * order after composition, and springs step afterward only with supplied state.
 * Otherwise springs and non-three-node twoBone descriptors remain deferred.
 * Unknown driver types throw.
 *
 * Discriminated on type: copy, aim, IK, parent, driven and spring.
 * IAutoMovieChannelLimit separately expresses component restriction.
 */
export type IAutoMovieDriver =
  | IAutoMovieCopyDriver
  | IAutoMovieAimDriver
  | IAutoMovieIKDriver
  | IAutoMovieParentDriver
  | IAutoMovieDrivenDriver
  | IAutoMovieSpringDriver;
