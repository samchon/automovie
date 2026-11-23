/**
 * The category of a deterministic constraint violation, aligned with the
 * engine's validator tiers.
 *
 * Validators assign the category to explain the rule that failed. The label
 * itself neither schedules checks nor chooses severity.
 */
export type AutoMovieViolationKind =
  /** Tier 1: wrong type, bad enum value, missing required field. */
  | "type"

  /** Tier 1: numeric value outside a declared `[min, max]`. */
  | "range"

  /** Tier 2: joint angle outside its anatomical range of motion. */
  | "rom"

  /** Tier 3: physical-plausibility warning (collision, penetration, balance). */
  | "physics"

  /**
   * Tier 4: temporal incoherence (non-monotonic time, excessive angular
   * velocity).
   */
  | "temporal"

  /** Tier 5: invalid generated mesh topology (non-manifold, etc.). */
  | "topology"

  /** Procedural: required authored or reviewed coverage is missing. */
  | "coverage";
