import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanPerformer } from "./IAutoMovieMotionHumanPerformer";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";

/**
 * An authored interval in which two people already grip one rigid prop. Their
 * base tracks supply stance, locomotion and finger posture. This operation
 * prepares only the two gripping arms. Use a separate action for approach,
 * grasp closure, letting go or changing the number of carriers.
 */
export namespace IAutoMovieMotionHumanSharedCarry {
  /** One performer holding one point throughout the carry interval. */
  export interface ICarrier {
    /** The performer whose body follows this grip. */
    performer: IAutoMovieMotionHumanPerformer;

    /** The gripping hand. */
    side: AutoMovieHumanSide;

    /** Name in the shared prop's points record. */
    site: string;

    /** The hand's rotation from rest, expressed in the prop's local frame. */
    rotation: IAutoMovieQuaternion;

    /**
     * Pure base posture track at film seconds, including an authored elbow
     * direction at the start.
     */
    posture: (seconds: number) => IAutoMovieMotionHumanPosture;
  }

  /**
   * Authored carry input on the film clock. The prop is available at its
   * authored start before the interval and stays at its terminal pose after
   * it.
   */
  export interface IInput {
    /**
     * Unmounted, unworn and undriven rigid prop with two distinct authored
     * points.
     */
    prop: IAutoMovieMotionHumanProp;

    /**
     * Distinct performers with distinct grip sites, in returned posture-reader
     * order.
     */
    carriers: readonly [ICarrier, ICarrier];

    /** First film second at which both hands grip. */
    from: number;

    /** Last film second at which both hands grip, up to 5 seconds after from. */
    to: number;

    /**
     * Pure prop world-frame track at film seconds in [from, to]. At from it
     * starts at prop.frame.
     */
    path: (seconds: number) => IAutoMovieRigidTransform;
  }

  /** One prop and the two prepared posture readers in input order. */
  export interface IPrepared {
    /** Pass to a performance as the single prop for the shared carry. */
    prop: IAutoMovieMotionHumanProp;

    /**
     * Pure film-second readers for the closed carry interval. The caller
     * supplies the posture outside it.
     */
    postures: readonly [ICarrier["posture"], ICarrier["posture"]];
  }
}
