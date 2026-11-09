/**
 * Additional native solver budget of one body for its released quality.
 *
 * A released body may declare a higher articulation solver budget than the
 * world's; Rapier adds per-body iterations on top of the world's own, so the
 * addition is the declared total minus the world's count, never negative.
 * Outside release, or without a declaration, nothing is added.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Additional native solver budget of one body for its released quality) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Additional native solver budget of one body for its released quality) directly over its typed inputs (`input`) as a fixed number of statements with no loop or recursion in the body, delegating to `Math.max`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 10 lines and 2 top-level statements that reuses `Math.max` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalReleasedQuality(input: {
  /** Declared released totals, when the body has a released quality policy. */ quality?: {
    /** Total articulation solver iterations while released. */ iterations: number;
    /** Total internal PGS iterations while released. */ internalIterations: number;
  };
  /** Whether the body's default tracking is currently withdrawn. */ released: boolean;
  /** World solver iterations per step. */ iterations: number;
  /** World internal PGS iterations per step. */ internalIterations: number;
}): {
  /** Additional solver iterations to set on every rigid body of the body. */ solver: number;
  /** Additional internal PGS iterations to set on every rigid body of the body. */ pgs: number;
} {
  if (!input.released || !input.quality) return { solver: 0, pgs: 0 };
  return {
    solver: Math.max(0, input.quality.iterations - input.iterations),
    pgs: Math.max(
      0,
      input.quality.internalIterations - input.internalIterations,
    ),
  };
}
