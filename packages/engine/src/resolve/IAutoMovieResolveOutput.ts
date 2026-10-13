import { IAutoMovieDriver } from "@automovie/interface";

import { IAutoMovieResolveViolation } from "./IAutoMovieResolveViolation";

/**
 * The resolved frame: world matrices, morph weights, and any clamps fired.
 *
 * @author Samchon
 */
export interface IAutoMovieResolveOutput {
  /** Node id → world matrix (`number[16]`, column-major). */
  world: Map<string, number[]>;

  /**
   * Node id → morph-target weights, for nodes whose `weights` channel animated.
   */
  weights: Map<string, number[]>;

  /** Every constraint breach that was clamped, in channel/component order. */
  violations: IAutoMovieResolveViolation[];

  /**
   * Drivers this pass could not resolve: surfaced, never dropped. After S2 only
   * two things can appear here: springs when no
   * {@link IAutoMovieResolveInput.springs} input was given (stateful: nothing to
   * step them with), and malformed two-bone chains (length ≠ 3).
   */
  deferredDrivers: IAutoMovieDriver[];
}
