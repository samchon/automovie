/**
 * One source-authored bounded activation of an existing world effect zone on the shot-local clock.
 *
 * @evidence contracts/common.md#principled-implementation Explicit validateAutoMovieEffects checks unique ids, matching compiled stream id/zone, half-open shot intervals, bounded intensity and same-zone chronology. Optional events must appear in the contract/sample tables and satisfy range comparisons, but that validator does not separately reject a NaN sample or prove its predicates; realizeShotContract owns finite sample and predicate realization.
 * @evidence contracts/common.md#clear-and-simple-design The cue owns activation and envelope while the world zone owns spatial bounds, recipe, seed and budget, keeping authored timing separate from deterministic effect materialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing compiled counterparts and absent or numerically out-of-cue event samples produce diagnostics when validation is explicitly called. The bare materializer drops unresolved world references; this type installs no automatic validator or complete event-realization gate.
 * @evidence contracts/common.md#meaningful-documentation Defines unique cue and zone identity, inclusive/exclusive seconds, intensity endpoints and optional authoritative event binding.
 */
export interface IAutoMovieShotEffectCue {
  /** Stable cue id, unique inside one shot. */
  id: string;

  /** Existing world effect-zone id. */
  zone: string;

  /** Inclusive shot-local start in seconds. */
  start: number;

  /** Exclusive shot-local end in seconds. */
  end: number;

  /** Bounded intensity envelope. */
  intensity: {
    /** Intensity at cue start. */
    from: number;

    /** Intensity at cue end. */
    to: number;
  };

  /** Optional authoritative shot event that must realize inside this cue. */
  event?: string;
}
