/**
 * The category of a deterministic constraint violation, aligned with the engine's validator tiers.
 *
 * Validators assign the category to explain the rule that failed. The label itself neither schedules checks nor chooses severity.
 *
 * @evidence contracts/common.md#principled-implementation The closed union distinguishes structural, numeric, anatomical, physical, temporal, topology and coverage rules reported by engine validators; error versus warning is carried separately.
 * @evidence contracts/common.md#clear-and-simple-design A literal category travels in the common violation record without a class hierarchy or automatic dispatcher.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type makes no timing benchmark or automatic correction claim; physical findings can be warnings while malformed geometry is an error according to the producer.
 * @evidence contracts/common.md#meaningful-documentation Each literal describes its rule category, and the introduction separates classification from severity and execution order.
 * @author Samchon
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
   * Tier 4: temporal incoherence (non-monotonic time, excessive angular velocity).
   */
  | "temporal"

  /** Tier 5: invalid generated mesh topology (non-manifold, etc.). */
  | "topology"

  /**
   * Procedural: required authored or reviewed coverage is missing.
   */
  | "coverage";
