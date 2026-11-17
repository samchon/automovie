/**
 * The bodyweight movements of the workout law a gym programme names beside
 * the ones the other tables hold. On the floor: the pike push-up, the
 * superman, the bird dog, the lying leg raise, the bicycle crunch, the
 * Russian twist and the dead bug. On two bars at the hips' height: the dip.
 *
 * Every angle is provisional, read off the exercise's usual description
 * (ACSM's Guidelines, 11th ed.; NSCA's Essentials of Strength Training and
 * Conditioning, 4th ed., for the dip); none is a measured value.
 *
 * The bars of a dip are places at the standing hips' height beside the body
 * unless the author names a prop (`on`): a support exercise's bars stand
 * within the standing body's reach. First pass: the dip's base is the
 * grammar's `hanging`, the body borne by its hands with its feet off the
 * floor, there being no base of a body supported above its hands; a bird
 * dog's hands are kept by the angles alone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The bodyweight movements of the workout law a gym programme names beside the ones the other tables hold. On the floor: the pike push-up, the superman, the bird dog, the lying leg raise, the bicycle crunch, the Russian twist and the dead bug. On two bars at the hips' height: the dip.
 * @evidence contracts/development/design.md#principled-representation Closed choices "pikePushUp", "superman", "birdDog", "lyingLegRaise", "bicycleCrunch", "russianTwist", "deadBug", "dip" distinguish the admitted cases.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutBodyweight.ts (WorkoutBodyweight.KINDS).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in WorkoutBodyweight.KINDS.
 */
export namespace IAutoMovieMotionHumanWorkoutBodyweight {
  /**
   * The exercises' names.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The exercises' names.
   * @evidence contracts/development/design.md#principled-representation Closed choices "pikePushUp", "superman", "birdDog", "lyingLegRaise", "bicycleCrunch", "russianTwist", "deadBug", "dip" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutBodyweight.ts (WorkoutBodyweight.KINDS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in WorkoutBodyweight.KINDS.
   */
  export type Name =
    | "pikePushUp"
    | "superman"
    | "birdDog"
    | "lyingLegRaise"
    | "bicycleCrunch"
    | "russianTwist"
    | "deadBug"
    | "dip";
}
