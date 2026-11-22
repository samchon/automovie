/**
 * Loads carried at the sides with the arms hanging, performed over a walk
 * (`HumanChain.over`): a farmer's walk. Each hand that holds a prop is let
 * down until its arm hangs nearly straight from the shoulder, a little out
 * from the thigh, the hand turned as it held the prop, and holds it there.
 *
 * Each wrist goes `HANG` of the arm (upper arm and forearm) below its
 * shoulder, read on the walk's posture each second, and `OUT` of the half
 * shoulder width out to the side; the arms leave their carrying pose over
 * `SETTLE` seconds and keep the walk's posture otherwise. The props stay in
 * the hands: the law grips them through its whole length and leaves them
 * held after.
 *
 * @evidence contracts/development/common.md#meaningful-documentation left: The prop the left hand holds; that arm is left to the walk when absent. right: The prop the right hand holds; that arm is left to the walk when absent. duration: Seconds the carry lasts; 3 when absent.
 * @evidence contracts/development/design.md#principled-representation left: The prop the left hand holds; that arm is left to the walk when absent. right: The prop the right hand holds; that arm is left to the walk when absent. duration: Seconds the carry lasts; 3 when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/carryHang.ts (carryHang.plan, context); handling/carryHang.ts (carryHang.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in carryHang.plan.
 */
export namespace IAutoMovieMotionHumanCarryHang {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The props held in each hand and how long the carry lasts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A hand with no prop is left to the walk.
   */
  export interface IParams {
    /** The prop the left hand holds; that arm is left to the walk when absent. */
    left?: string;

    /** The prop the right hand holds; that arm is left to the walk when absent. */
    right?: string;

    /** Seconds the carry lasts; 3 when absent. */
    duration?: number;
  }
}
