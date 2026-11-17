import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanPerformer } from "./IAutoMovieMotionHumanPerformer";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";

/**
 * An authored interval in which two people already grip one rigid prop.
 * Their base tracks supply stance, locomotion and finger posture. This
 * operation prepares only the two gripping arms. Use a separate action for
 * approach, grasp closure, letting go or changing the number of carriers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines who is in contact, what the tracks supply and where this phase starts and ends.
 * @evidence contracts/development/design.md#principled-representation A single rigid world track and two named prop-local grip points define both contact trajectories in film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Input, actors and prepared readers for AutoMovieMotionHumanSharedCarry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the performance prop, performer, posture and rigid-frame contracts.
 */
export namespace IAutoMovieMotionHumanSharedCarry {
  /**
   * One performer holding one point throughout the carry interval.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the hand, authored point, orientation frame and underlying posture.
   * @evidence contracts/development/design.md#principled-representation The grip point and hand basis are constants in the moving prop's own frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only what the arm planner and the resulting posture reader need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The point names the prop's public points record and the body is the performer's canonical body.
   */
  export interface ICarrier {
    /** The performer whose body follows this grip. */
    performer: IAutoMovieMotionHumanPerformer;

    /** The gripping hand. */
    side: AutoMovieHumanSide;

    /** Name in the shared prop's points record. */
    site: string;

    /** The hand's rotation from rest, expressed in the prop's local frame. */
    rotation: IAutoMovieQuaternion;

    /** Pure base posture track at film seconds, including an authored elbow direction at the start. */
    posture: (seconds: number) => IAutoMovieMotionHumanPosture;
  }

  /**
   * Authored carry input on the film clock. The prop is available at its
   * authored start before the interval and stays at its terminal pose after it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the prop's lifecycle and the bounds of the simultaneous carry.
   * @evidence contracts/development/design.md#principled-representation Both performers share one path and one closed interval.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One prop and its path, two carriers and the common span.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The prop's site positions are taken from its canonical data, with no carry-specific geometry.
   */
  export interface IInput {
    /** Unmounted, unworn and undriven rigid prop with two distinct authored points. */
    prop: IAutoMovieMotionHumanProp;

    /** Distinct performers with distinct grip sites, in returned posture-reader order. */
    carriers: readonly [ICarrier, ICarrier];

    /** First film second at which both hands grip. */
    from: number;

    /** Last film second at which both hands grip, up to 5 seconds after from. */
    to: number;

    /** Pure prop world-frame track at film seconds in [from, to]. At from it starts at prop.frame. */
    path: (seconds: number) => IAutoMovieRigidTransform;
  }

  /**
   * One prop and the two prepared posture readers in input order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States where the prop and postures are read and who owns the motion outside the interval.
   * @evidence contracts/development/design.md#principled-representation The prop exposes its single track through the existing motion hook.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One shared prop and one posture reader per performer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Returns canonical postures and the canonical performance prop.
   */
  export interface IPrepared {
    /** Pass to a performance as the single prop for the shared carry. */
    prop: IAutoMovieMotionHumanProp;

    /** Pure film-second readers for the closed carry interval. The caller supplies the posture outside it. */
    postures: readonly [ICarrier["posture"], ICarrier["posture"]];
  }
}
