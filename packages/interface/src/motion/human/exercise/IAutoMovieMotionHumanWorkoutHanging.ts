/**
 * The exercises of the workout law done hanging from a bar by both hands
 * (#3377's bars, #3378's pull-ups): the dead hang, the pull-up, the
 * chin-up, the hanging knee raise and the swing.
 *
 * The fists' mean (the hands' grip sockets) stays on the bar and everything else follows from the
 * joints: a pull-up is the elbows' and the shoulders' flexion with the
 * hands fixed, so the body rises by what the arms shorten; a swing is the
 * whole body's pitch about the hands. Angles are provisional (NSCA's
 * Essentials of Strength Training, 4th ed., for the pull-up's top: the chin
 * over the bar, the elbows beside the ribs).
 *
 * First pass: the body is lifted to the bar
 * from standing without a jump being planned; a swing's rate is keyed, not
 * a pendulum's; a chin-up differs from a pull-up by the elbows kept ahead,
 * the forearm's turn not written.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The exercises of the workout law done hanging from a bar by both hands (#3377's bars, #3378's pull-ups): the dead hang, the pull-up, the chin-up, the hanging knee raise and the swing.
 * @evidence contracts/development/design.md#principled-representation Closed choices "deadHang", "pullUp", "chinUp", "kneeRaise", "barSwing" distinguish the admitted cases.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutHanging.ts (WorkoutHanging.KINDS).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in WorkoutHanging.KINDS.
 */
export namespace IAutoMovieMotionHumanWorkoutHanging {
  /**
   * The exercises' names.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The exercises' names.
   * @evidence contracts/development/design.md#principled-representation Closed choices "deadHang", "pullUp", "chinUp", "kneeRaise", "barSwing" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutHanging.ts (WorkoutHanging.KINDS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in WorkoutHanging.KINDS.
   */
  export type Name =
    | "deadHang"
    | "pullUp"
    | "chinUp"
    | "kneeRaise"
    | "barSwing";
}
