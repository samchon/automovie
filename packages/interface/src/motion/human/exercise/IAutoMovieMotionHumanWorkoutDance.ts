/**
 * The held dance shapes of the workout law (#3879 breaking, #3991 ballet,
 * #4010 street grooves): the ballet arabesque on a turned-out leg, the
 * breaking baby freeze on both hands, and the street rock with its chest and
 * head isolations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three shapes and the sub-issues they serve.
 * @evidence contracts/development/design.md#principled-representation Closed choices "arabesque", "babyFreeze", "streetRock" distinguish the admitted steps.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutDance.ts (WorkoutDance.KINDS).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in WorkoutDance.KINDS.
 */
export namespace IAutoMovieMotionHumanWorkoutDance {
  /**
   * The steps' names.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The steps' names.
   * @evidence contracts/development/design.md#principled-representation Closed choices "arabesque", "babyFreeze", "streetRock".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutDance.ts (WorkoutDance.KINDS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Name = "arabesque" | "babyFreeze" | "streetRock";
}
