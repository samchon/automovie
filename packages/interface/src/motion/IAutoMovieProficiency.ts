/**
 * How skilled a performer is, from clumsy to expert: a named level or a
 * continuous `p` in [0, 1], with optional per-axis overrides in [0, 1].
 *
 * The named levels are `novice` 0, `amateur` 0.35, `trained` 0.7 and `elite`
 * 1. An axis names one dimension motor-learning studies measure separately:
 * `timing` (rhythm variability), `path` (trajectory smoothness and wobble),
 * `balance` (postural sway), `guard` (protective posture kept), `power`,
 * `speed` (peak distal speed), `recovery` (time back to readiness),
 * `reaction` (reaction time), `anticipation` (lead from reading the other's
 * movement) and `sequencing` (proximal-to-distal coordination). An axis
 * absent from `axes` takes the overall value. Proficiency changes timing,
 * path and outcome; it never raises a joint's range of motion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the named levels' values, every axis with what it measures, the default for an absent axis and what proficiency never changes.
 * @evidence contracts/development/design.md#principled-representation A named level or a continuous value, with per-axis overrides along the dimensions motor-learning studies measure separately.
 * @evidence contracts/development/design.md#minimal-and-owned-surface States skill only; how each axis changes a motion belongs to the laws that read it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps skill apart from the range of motion, so proficiency cannot raise what a joint can do.
 */
export type IAutoMovieProficiency =
  | {
      /** A named level. */
      level: "novice" | "amateur" | "trained" | "elite";
      /** Per-axis overrides in [0, 1]. */
      axes?: Partial<Record<IAutoMovieProficiency.Axis, number>>;
    }
  | {
      /** A continuous value in [0, 1]. */
      p: number;
      /** Per-axis overrides in [0, 1]. */
      axes?: Partial<Record<IAutoMovieProficiency.Axis, number>>;
    };
/** Companion types of {@link IAutoMovieProficiency}. */
export namespace IAutoMovieProficiency {
  /**
   * One measured dimension of skill.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each axis is described on {@link IAutoMovieProficiency}.
   * @evidence contracts/development/design.md#principled-representation One name per dimension that studies measure separately.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The names only; their effects belong to the laws.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union, so an unknown axis is a type error.
   */
  export type Axis =
    | "timing"
    | "path"
    | "balance"
    | "guard"
    | "power"
    | "speed"
    | "recovery"
    | "reaction"
    | "anticipation"
    | "sequencing";
}
