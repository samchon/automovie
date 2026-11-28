import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanActionLaw } from "./IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanChain } from "./IAutoMovieMotionHumanChain";
import type { IAutoMovieMotionHumanPerformer } from "./IAutoMovieMotionHumanPerformer";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";
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

  /**
   * Stock carton episode. Both performers start on the floor and prepare
   * ordinary pickups from the carton's admitted rest frame. The carton waits
   * through the later grip, follows the common course with both hands on their
   * handles, and settles on the receiving face before either release.
   */
  export interface IStage {
    /** Unique name for this episode's role anchors and registered law. */
    id: string;

    /** Seed used by the normal pickup planner for both roles. */
    seed: string;

    /** Rigid carton with two named round rails and a box collider. */
    prop: IAutoMovieMotionHumanProp;

    /** Independent actor preparations in the returned chain order. */
    carriers: readonly [IStageRole, IStageRole];

    /** Finite fixed face supporting all four carton corners at entry. */
    start: IStageSupport;

    /** Finite fixed face supporting all four carton corners at placement. */
    end: IStageSupport;

    /** Short rigid movement from the initial frame to the supported frame. */
    course: IStageCourse;
  }

  /** One grounded performer and a distinct material handle. */
  export interface IStageRole {
    /** Stored body, starting stance, heading, and skill. */
    performer: IAutoMovieMotionHumanPerformer;

    /** Side of the hand that takes and releases this grip. */
    hand: AutoMovieHumanSide;

    /** Named round rail on the carton. */
    handle: string;

    /** Seconds standing before the pickup starts. The default is zero. */
    wait?: number;

    /**
     * Seconds to continue holding after the carton settles. Defaults to 0.08.
     * Different values schedule a one-sided hold before the remaining release.
     */
    releaseAfter?: number;
  }

  /** Fixed prop and material face occupied by the carton's bottom. */
  export interface IStageSupport {
    /** The receiver supplied to the performance on the same scene. */
    prop: IAutoMovieMotionHumanProp;

    /** Named surface affordance with a finite perimeter. */
    point: string;
  }

  /** One closed rigid course, initialized from the carton's rest frame. */
  export interface IStageCourse {
    /**
     * Seconds from the second grip to settlement, greater than zero and at most
     * five.
     */
    duration: number;

    /** Peak height above the straight endpoint line, in metres. */
    rise: number;

    /** Destination origin and attitude in the world frame. */
    to: IAutoMovieRigidTransform;
  }

  /** Prepare both role chains at film zero on the same registering performance. */
  export interface IStaged {
    /** Episode record for the performance input's shared carry list. */
    episode: IPreparedEpisode;

    /** The common registered law of the two role chains. */
    law: IAutoMovieMotionHumanActionLaw;

    /** The two roles in input order. Each can take normal following actions. */
    chains: readonly [IAutoMovieMotionHumanChain, IAutoMovieMotionHumanChain];
  }

  /** A prepared prop span and its two timed material roles. */
  export interface IPreparedEpisode {
    /** Subject id of the original rigid prop supplied to the performance. */
    readonly prop: string;

    /** Film second of the first played grip. */
    readonly from: number;

    /** Film second when the material receiving face supports the prop. */
    readonly settled: number;

    /** Film second when the last role releases its grip. */
    readonly to: number;

    /** World frame at a film second, independent of live performer reads. */
    readonly frame: (seconds: number) => IAutoMovieRigidTransform;

    /** The two authored grip intervals. */
    readonly roles: readonly [IPreparedRole, IPreparedRole];
  }

  /** One placed hand's claim on one named handle. */
  export interface IPreparedRole {
    /** The performer who closes this hand. */
    readonly subject: string;

    /** The actor's gripping hand. */
    readonly hand: AutoMovieHumanSide;

    /** Material handle kept by the grip. */
    readonly handle: string;

    /** The registered action's anchor, which owns its played cues. */
    readonly anchor: string;

    /** Film second of this hand's closure. */
    readonly from: number;

    /** Film second when this hand opens. */
    readonly to: number;
  }
}
