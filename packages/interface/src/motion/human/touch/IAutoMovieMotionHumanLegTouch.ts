import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A touch with the leg while standing (#3357's effectors below the hip): the
 * toes, the heel or the knee of one leg is brought onto a place and held
 * there, the other leg bearing the body.
 *
 * The body first moves over its standing foot: the root is shifted level
 * until the centre of mass lies over that ankle (`HumanBalance.support`),
 * the standing leg keeping its planted goal. The moving leg is then a goal
 * of the posture resolver, as an arm is: for the toes and the heel the
 * ankle is placed so that part of the foot, read in the foot's rest frame
 * and turned as the foot stood at the entry, lies on the place; for the knee
 * the thigh's length fixes where the hip must be, so the root is shifted
 * further along the level line to the place until the knee, the leg's bend
 * hint, is exactly a thigh from the displayed hip, and the shank hangs
 * from it with the foot left free, since a foot held as it stood would
 * state another plane for the knee. A place the leg does not reach so is
 * refused.
 *
 * Events: `ready` on the place, `strokeEnd` and `relax` at the hold's end,
 * as a touch's. The leg may be cut from `relax` on.
 *
 * First pass: the foot's parts are offsets of the ankle (provisional where
 * marked), the shin is the round kick's and has no slow stroke here, the
 * contact is not declared as a window, and the standing balance is the
 * static one, not checked through the lift.
 *
 * @evidence contracts/development/common.md#meaningful-documentation with: The part of the leg; the toes when absent. side: The leg; `right` when absent. hold: Seconds the leg stays on the place; 0.5 when absent.
 * @evidence contracts/development/design.md#principled-representation with: The part of the leg; the toes when absent. side: The leg; `right` when absent. hold: Seconds the leg stays on the place; 0.5 when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: touch/legTouch.ts (legTouch.plan, context); touch/legTouch.ts (legTouch.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanLegTouch {
  /**
   * The part of the leg that touches.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The part of the leg that touches.
   * @evidence contracts/development/design.md#principled-representation Closed choices "toes", "heel", "knee" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: touch/legTouch.ts (legTouch.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in legTouch.plan.
   */
  export type With = "toes" | "heel" | "knee";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The place as the shared target union, the part as a closed union, the hold in seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target union.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The place touched. */
    target: IAutoMovieMotionTarget;

    /** The part of the leg; the toes when absent. */
    with?: IAutoMovieMotionHumanLegTouch.With;

    /** The leg; `right` when absent. */
    side?: "left" | "right";

    /** Seconds the leg stays on the place; 0.5 when absent. */
    hold?: number;
  }
}
