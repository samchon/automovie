import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanTarget } from "./IAutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanTouchUpright } from "./IAutoMovieMotionHumanTouchUpright";

/**
 * How far a vessel is leaned toward the face at the lips, and turned there,
 * so the arm that brings it holds it as a person drinks: the least lean, in
 * `LEAN_STEP` degrees up to `LEAN`, whose fitted arm drinks with the
 * vessel where it was asked (`AutoMovieMotionHumanDrinkingArm.drinks`, its
 * reached axis within a `LEAN_STEP` of the asked one), with the facing
 * (`AutoMovieMotionHumanTouchUpright`) whose hand meets the vessel's axis
 * best, or for a vessel held by the grasp it was taken up by, the lean
 * alone (`held`). Held exactly upright at the lips the vessel asks the elbow
 * up to the shoulder's height; a drinker tips the glass at the lips with the
 * elbow low (Murphy, Willén and Sunnerhagen 2011).
 *
 * @evidence contracts/development/common.md#meaningful-documentation lean: How far the vessel's axis leans from where the grasp holds it toward the region, degrees. bend: The elbow's hint, world metres.
 * @evidence contracts/development/design.md#principled-representation lean: How far the vessel's axis leans from where the grasp holds it toward the region, degrees. bend: The elbow's hint, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.drinking, after); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.admitted, after); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.held, after); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.held.found.later, phase); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.trial, after); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.drinking, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPosture.IGoal, IAutoMovieVector3, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanTarget.IPlace identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTouchDrink {
  /**
   * A vessel held by a kept grasp, leaned toward the face: the lean and the
   * wrist's goal that brings the vessel there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The lean found and the goal it gives, so the stroke and its reference read the one goal the arm was admitted with.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members: the stroke reads the goal, a reader of the law the lean.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The goal is the admitted one, never rebuilt by the caller.
   */
  export interface IHeld {
    /** How far the vessel's axis leans from where the grasp holds it toward the region, degrees. */
    lean: number;

    /** The wrist's goal at that lean: its point, its rotation, the elbow's hint and the vessel's point as the contact, world. */
    goal: IAutoMovieMotionHumanPosture.IGoal;
  }

  /**
   * The facing and lean `drinking` found, with the elbow's hint its arm
   * was admitted with, so the stroke shows that arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member states its meaning and frame; the facing's own are `IAutoMovieMotionHumanTouchUpright.IFacing`'s.
   * @evidence contracts/development/design.md#principled-representation The search's answer and the hint it was admitted with, one record, so the stroke reads the arm the admission read.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One member beyond the facing's, read by the hand-to-face arm.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hint is the one the admitted arm was fitted with, never solved again by the caller.
   */
  export interface IDrink extends IAutoMovieMotionHumanTouchUpright.IFacing {
    /** The elbow's hint, world metres. */
    bend: IAutoMovieVector3;
  }

  /**
   * Where the vessel is held after it arrives, while the drinker drinks: the
   * posture with the head turned for the drinking phase and the region on
   * it. A lean is admitted only if the arm still holds the vessel at its
   * asked axis there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and frame.
   * @evidence contracts/development/design.md#principled-representation The drinking phase's posture and region, the second place the arm must hold the vessel.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by `trial` and `held`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The region is read on that posture, never moved by hand.
   */
  export interface IAfter {
    /** The posture of the drinking phase. */
    posture: IAutoMovieMotionHumanPosture;

    /** The region on it. */
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">;
  }
}
