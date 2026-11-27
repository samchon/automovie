import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanGrasp } from "./IAutoMovieMotionHumanGrasp";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";
import type { IAutoMovieHumanLimbReference } from "./IAutoMovieHumanLimbReference";
import type { IAutoMovieMotionHumanHand } from "./IAutoMovieMotionHumanHand";

/**
 * Role inputs and plans for handover operations.
 */
export namespace IAutoMovieMotionHumanHandover {
  /** Plan a handover. How the handover ends. */
  export type Outcome = "transfer" | "withdraw" | "decline";

  /** One side's state at the start. */
  export interface IPerson {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The acting hand. */
    side: AutoMovieHumanSide;

    /** The person's displayed world bones at the start. */
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >;
  }

  /** Plan a handover. The planner's input. */
  export interface IInput {
    /** The giver, holding the prop in its acting hand. */
    giver: IAutoMovieMotionHumanHandover.IPerson;

    /** The receiver. */
    receiver: IAutoMovieMotionHumanHandover.IPerson;

    /** The prop. */
    prop: IAutoMovieMotionHumanProp;

    /** The prop's displayed frame at the start. */
    frame: IAutoMovieRigidTransform;

    /** The receiver's grip affordance id. */
    handle: string;

    /** The prop's mass, kilograms; 0.09 when absent. */
    mass?: number;

    /** The outcome; `transfer` when absent. */
    outcome?: IAutoMovieMotionHumanHandover.Outcome;

    /**
     * Where the receiving grip is handed over, world metres, as the partners'
     * meeting places it (`HumanHandoverMeeting`); the standing pair's mutual
     * goal when absent.
     */
    meet?: IAutoMovieVector3;
  }

  /** The shared plan; every time is seconds from the handover's start. */
  export interface IPlan {
    /** The outcome. */
    outcome: IAutoMovieMotionHumanHandover.Outcome;

    /** Where the giver's hand starts. */
    giverFrom: IAutoMovieMotionHumanHand.IWrist;

    /** Where the giver's hand offers the prop. */
    giverAt: IAutoMovieMotionHumanHand.IWrist;

    /** The prop's frame at the offer. */
    offered: IAutoMovieRigidTransform;

    /** Where the receiver's hand starts. */
    receiverFrom: IAutoMovieMotionHumanHand.IWrist;

    /** The receiver's grasp target on the offered prop. */
    target: IAutoMovieMotionHumanGrasp.ITarget;

    /** The receiver's wrist at the grasp. */
    receiverAt: IAutoMovieMotionHumanHand.IWrist;

    /**
     * The receiver's hand as its arm achieves the grasp, where the digits
     * close.
     */
    receiverShown: IAutoMovieMotionHumanHand.IWrist;

    /**
     * The receiver's arm solution at the grasp, which its hold and take-away
     * keep.
     */
    receiverReference: IAutoMovieHumanLimbReference;

    /** The giver's transport time. */
    offer: number;

    /** When the receiver's reach starts. */
    reachStart: number;

    /** The receiver's reach time. */
    reach: number;

    /** When the receiver's grip closes (or its hand stops short). */
    gripClosed: number;

    /** Both hands' shared hold. */
    transfer: number;

    /** When the giver lets go, or starts withdrawing. */
    release: number;
  }
}
