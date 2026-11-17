import type { IAutoMovieMotionHumanFrame } from "../posture/IAutoMovieMotionHumanFrame";

/**
 * Climbing a vertical fixed ladder from the floor before it, in the
 * four-beat ipsilateral pattern: right hand, right foot, left hand, left
 * foot, one limb moving at a time, so three limbs always hold the ladder
 * (Jensen and Holland 2020, Int J Environ Res Public Health 17:2897).
 *
 * The goals are rungs: the ladder is a prop of the scene, a fixture
 * (`IAutoMovieMotionHumanProp.fixed`) that the hands grip and never carry, and its rungs are
 * its own `rung1` upward (`createLadder`'s affordances), read where the
 * ladder stands at the action's start. The rungs' spacing must lie in OSHA
 * 1910.23(b)(2)'s 25 to 36 cm and their line be upright; the climber stands
 * before the ladder, facing it within `FACING` degrees, the toes within
 * `NEAR` of the rungs and between the rails. A ladder that is no fixture,
 * leans, has too few rungs above the hands, or one the climber stands away
 * from, is refused. Each foot stands with its ball on a rung's top,
 * and each hand grips a rung (Jensen and Holland found rungs used in 59 of
 * 80 tasks) at the rung nearest the shoulder's height above the feet. First
 * both hands reach their rungs, then every beat moves one limb up one rung:
 * a foot on a minimum-jerk arc that clears the rung below by `CLEARANCE`, a
 * hand on a minimum-jerk path. The pelvis stays `BACK` leg lengths behind
 * the rungs and rises with the feet, lowered wherever a planted leg could
 * not reach. Each beat takes `BEAT` seconds (provisional), scaled by the
 * manner's tempo. Events: `handsOn`, then per beat `<limb>Release<n>` and
 * `<limb>Contact<n>`, the limb one of `rightHand`, `rightFoot`, `leftHand`,
 * `leftFoot`.
 *
 * Not yet: the two-beat patterns, rail grips, climbing down, the top-out,
 * and hanging, traversing, mantling and vaulting (the rest of #3238); the
 * A8 `bar` and `ledge` kinds the core owns.
 *
 * @evidence contracts/development/common.md#meaningful-documentation ahead: The rungs' distance ahead in that frame, metres: 0, the frame's origin lying in their plane. spacing: The rung spacing, metres. radius: A rung's radius, metres.
 * @evidence contracts/development/design.md#principled-representation ahead: The rungs' distance ahead in that frame, metres: 0, the frame's origin lying in their plane. spacing: The rung spacing, metres. radius: A rung's radius, metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: climbing/HumanLadder.ts (HumanLadder.of, return); climbing/HumanLadder.ts (HumanLadder.rung, ladder); climbing/climbLadder.ts (climbLadder.plan); executable/cases/climbCases.ts (climbCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanFrame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanLadder {
  /**
   * A ladder as the plan resolved it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The rungs' plane and spacing in the ladder's own floor frame, read off its prop at the start.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `rung` and the capture.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain numbers, each the prop's own.
   */
  export interface ILadder {
    /** The ladder's floor frame: origin at its foot under the rungs' middle, the heading the climber faces it by. */
    frame: IAutoMovieMotionHumanFrame;

    /** The rungs' distance ahead in that frame, metres: 0, the frame's origin lying in their plane. */
    ahead: number;

    /** The rung spacing, metres. */
    spacing: number;

    /** How many rungs the ladder has. */
    count: number;

    /** A rung's radius, metres. */
    radius: number;

    /** The rungs' clear width between the rails, metres; unbounded when the rung declares no length. */
    width: number;
  }
}
