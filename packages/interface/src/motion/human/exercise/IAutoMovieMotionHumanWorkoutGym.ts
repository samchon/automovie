/**
 * The gym's standing movements of the workout law: free-weight exercises a
 * programme names beside the ones the other tables hold, shown here without
 * their load unless the author names one (`load`): the bent-over row, the
 * curl, the overhead triceps extension, the lateral and the front raise,
 * the shrug, the calf raise, the front and the goblet squat, the split squat, the wall
 * sit, the Romanian deadlift, the good morning, and the power clean and the
 * snatch as their phases, and the clean and squat jerk. The floor exercises and the dip are
 * `WorkoutBodyweight`'s.
 *
 * Every angle is provisional, read off the exercise's usual description
 * (NSCA's Essentials of Strength Training and Conditioning, 4th ed.,
 * exercise technique chapters); none is a measured value.
 *
 * First pass: no bar, dumbbell or bell is held, so a hand's place is what
 * the arm's angles give; the wall of a wall sit is a place, not a prop; the
 * clean and the snatch show their positions in
 * order at a keyed tempo, not the bar's flight; a step-up, an incline or
 * decline push-up and a hip thrust are `WorkoutEquipment`'s (they need a
 * box or bench under a hand, a foot or the back).
 *
 * @evidence contracts/development/common.md#meaningful-documentation The gym's standing movements of the workout law: free-weight exercises a programme names beside the ones the other tables hold, shown here without their load unless the author names one (`load`): the bent-over row, the curl, the overhead triceps extension, the lateral and the front raise, the shrug, the calf raise, the front and the goblet squat, the split squat, the wall sit, the Romanian deadlift, the good morning, and the power clean and the snatch as their phases. The floor exercises and the dip are `WorkoutBodyweight`'s.
 * @evidence contracts/development/design.md#principled-representation Closed choices "bentOverRow", "curl", "tricepsExtension", "lateralRaise", "frontRaise", "shrug", "calfRaise", "frontSquat", "gobletSquat", "splitSquat", "wallSit", "romanianDeadlift", "goodMorning", "powerClean", "snatch" distinguish the admitted cases.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutGym.ts (WorkoutGym.KINDS).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in WorkoutGym.KINDS.
 */
export namespace IAutoMovieMotionHumanWorkoutGym {
  /**
   * The exercises' names.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The exercises' names.
   * @evidence contracts/development/design.md#principled-representation Closed choices include a power clean, a clean and squat jerk and a snatch as distinct phase routes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutGym.ts (WorkoutGym.KINDS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in WorkoutGym.KINDS.
   */
  export type Name =
    | "bentOverRow"
    | "curl"
    | "tricepsExtension"
    | "lateralRaise"
    | "frontRaise"
    | "shrug"
    | "calfRaise"
    | "frontSquat"
    | "gobletSquat"
    | "splitSquat"
    | "wallSit"
    | "romanianDeadlift"
    | "goodMorning"
    | "powerClean"
    | "cleanAndJerk"
    | "snatch";
}
