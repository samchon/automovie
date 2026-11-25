import type { IAutoMovieDriver } from "../../core/IAutoMovieDriver";
import type { IAutoMovieResolveViolation } from "./IAutoMovieResolveViolation";

/**
 * Caller-owned numerical frame maps and diagnostic arrays. World matrices are
 * column-major; unexecuted drivers remain explicit rather than disappearing
 * from resolution.
 */
export interface IAutoMovieResolveOutput {
  /** Node id → world matrix (`number[16]`, column-major). */
  world: Map<string, number[]>;

  /** Node id → morph-target weights, for nodes whose `weights` channel animated. */
  weights: Map<string, number[]>;

  /** Every constraint breach that was clamped, in channel/component order. */
  violations: IAutoMovieResolveViolation[];

  /**
   * Drivers not advanced by this pass: springs without state/dt and malformed
   * two-bone chains. The returned array keeps their borrowed descriptors
   * visible.
   */
  deferredDrivers: IAutoMovieDriver[];
}
