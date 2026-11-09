import { IAutoMovieDriver } from "@automovie/interface";

import { IAutoMovieResolveViolation } from "./IAutoMovieResolveViolation";

/**
 * Caller-owned numerical frame maps and diagnostic arrays. World matrices are column-major; unexecuted drivers remain explicit rather than disappearing from resolution.
 *
 * @evidence contracts/development/design.md#principled-representation Return world matrices, animated morph weights, channel-addressed clamp violations and drivers explicitly deferred by the world pass.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separate maps and diagnostic arrays let rendering consume numerical output while correction callers retain the actual failure provenance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Deferred springs without state and malformed two-bone chains remain visible; an empty violation list proves no applied bound crossed, not arbitrary scene validity.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify column-major world matrices, animated-only weights, violation order and the current defer conditions.
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
   * Drivers not advanced by this pass: springs without state/dt and malformed two-bone chains. The returned array keeps their borrowed descriptors visible.
   */
  deferredDrivers: IAutoMovieDriver[];
}
