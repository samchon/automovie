import { IAutoMovieDriver } from "@automovie/interface";

import { IAutoMovieResolveViolation } from "./IAutoMovieResolveViolation";

/**
 * Caller-owned numerical frame maps and diagnostic arrays. World matrices are column-major; unexecuted drivers remain explicit rather than disappearing from resolution.
 *
 * @evidence contracts/common.md#principled-implementation Return world matrices, animated morph weights, channel-addressed clamp violations and drivers explicitly deferred by the world pass.
 * @evidence contracts/common.md#clear-and-simple-design Separate maps and diagnostic arrays let rendering consume numerical output while correction callers retain the actual failure provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Deferred springs without state and malformed two-bone chains remain visible; an empty violation list proves no applied bound crossed, not arbitrary scene validity.
 * @evidence contracts/common.md#meaningful-documentation Members identify column-major world matrices, animated-only weights, violation order and the current defer conditions.
 * @evidence contracts/performance.md#efficient-algorithms Output grows with N composed nodes, sampled weights, crossed components and deferred drivers; matrix storage is sixteen numbers per node.
 * @evidence contracts/performance.md#reuse-equivalent-work Completed frame maps are returned directly; a changed time, graph, policy or spring state requires new resolution rather than identity-only reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns result maps/arrays for its frame lifetime; no native buffer, GPU node or asynchronous task is retained by the type.
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
   * Drivers not advanced by this pass: springs without state/dt and malformed two-bone chains. The returned array keeps their borrowed descriptors visible.
   */
  deferredDrivers: IAutoMovieDriver[];
}
