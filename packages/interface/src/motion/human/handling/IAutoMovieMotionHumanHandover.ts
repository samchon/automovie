import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanGrasp } from "./IAutoMovieMotionHumanGrasp";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanProp } from "../perform/IAutoMovieMotionHumanProp";
import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * The shared plan of one object passing from a giver's hand to a receiver's:
 * where it is handed over, when each hand moves, when the receiver's grip
 * closes and when the giver lets go.
 *
 * Both the giver's and the receiver's laws compute this same plan from the
 * same inputs (both bodies, both people's displayed bones at the start and
 * the prop's frame there), so the two hands agree without either reading the
 * other's moving plan, and the giver's release follows the receiver's grip by
 * construction.
 *
 * - Where: the object's receiving grip lands on the mutual goal of the
 *   giver's and the receiver's acting shoulders (`resolveAutoMovieMutualGoal`
 *   with the handshake's comfortable reach): handovers take place midway
 *   between the partners (Hansen et al. 2017, reviewed by Kopnarski et al.
 *   2023), with the object's middle at {@link EXCHANGE} of the partners' mean
 *   sternum height, moved only as far as both arms' reach demands
 *   (`HumanHandoverMeeting.goal`). Both laws read the place from the one
 *   meeting record (`HumanHandoverMeeting`, `meet`), where a seated pair
 *   leans its trunks when the arms alone fall short. The object
 *   keeps the orientation the giver holds it in, so the receiver grasps the
 *   grip its author named as the one offered.
 * - When: the giver's transport takes the loaded-carry time over its travel
 *   (`HumanPrehension.carry`); the receiver's reach, timed for its travel and
 *   the grasped width, starts so it ends no earlier than the giver's (the
 *   receiver begins reaching during the giver's transport, Kopnarski 2023),
 *   and its grip closes at `gripClosed`. Both hands then hold the object for
 *   the transfer time, 0.5 s for 90 g (Mason and MacKenzie 2005, Exp. Brain
 *   Res. 163:173) to 0.64 s for 1.8 kg (Doehring et al. 2020), linear in mass
 *   between and held at the ends outside, and only then does the giver open:
 *   the giver releases as the receiver takes the load (Mason and MacKenzie
 *   2005; Controzzi et al. 2018), never before `gripClosed`.
 *
 * Outcomes other than a transfer reuse the same where and when: `withdraw`
 * pulls the offer back as the receiver's hand comes within its approach
 * setback, so the receiver's hand stops short and returns; `decline` leaves
 * the receiver's hand where it is and the giver withdraws after the transfer
 * time. A drop needs the physics layer to carry the falling object
 * (#3083) and is not offered.
 *
 * @evidence contracts/development/common.md#meaningful-documentation mass: The prop's mass, kilograms; 0.09 when absent. outcome: The outcome; `transfer` when absent. meet: Where the receiving grip is handed over, world metres, as the partners' meeting places it (`HumanHandoverMeeting`); the standing pair's mutual goal when absent.
 * @evidence contracts/development/design.md#principled-representation mass: The prop's mass, kilograms; 0.09 when absent. outcome: The outcome; `transfer` when absent. meet: Where the receiving grip is handed over, world metres, as the partners' meeting places it (`HumanHandoverMeeting`); the standing pair's mutual goal when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanHandover.ts (HumanHandover.plan, return); handling/HumanHandover.ts (HumanHandover.plan, input); handling/HumanHandoverMeeting.ts (HumanHandoverMeeting.goal, input); handling/HumanHandover.ts (HumanHandover.plan.hand, bones); handling/HumanHandoverMeeting.ts (HumanHandoverMeeting.goal.sternum, person); handling/HumanHandoverMeeting.ts (HumanHandoverMeeting.kind.person, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanHand.Side, AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanHandover {
  /**
   * Plan a handover. How the handover ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Plan a handover. How the handover ends.
   * @evidence contracts/development/design.md#principled-representation Closed choices "transfer", "withdraw", "decline" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanHandover.ts (HumanHandover.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanHandover.plan.
   */
  export type Outcome = "transfer" | "withdraw" | "decline";

  /**
   * One side's state at the start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation body: The body. side: The acting hand. bones: The person's displayed world bones at the start.
   * @evidence contracts/development/design.md#principled-representation body: The body. side: The acting hand. bones: The person's displayed world bones at the start.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanHandover.ts (HumanHandover.plan.hand, bones); handling/HumanHandoverMeeting.ts (HumanHandoverMeeting.goal.sternum, person); handling/HumanHandoverMeeting.ts (HumanHandoverMeeting.kind.person, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanHand.Side, AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPerson {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The acting hand. */
    side: IAutoMovieMotionHumanHand.Side;

    /** The person's displayed world bones at the start. */
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >;
  }

  /**
   * Plan a handover. The planner's input.
   *
   * @evidence contracts/development/common.md#meaningful-documentation mass: The prop's mass, kilograms; 0.09 when absent. outcome: The outcome; `transfer` when absent. meet: Where the receiving grip is handed over, world metres, as the partners' meeting places it (`HumanHandoverMeeting`); the standing pair's mutual goal when absent.
   * @evidence contracts/development/design.md#principled-representation mass: The prop's mass, kilograms; 0.09 when absent. outcome: The outcome; `transfer` when absent. meet: Where the receiving grip is handed over, world metres, as the partners' meeting places it (`HumanHandoverMeeting`); the standing pair's mutual goal when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanHandover.ts (HumanHandover.plan, input); handling/HumanHandoverMeeting.ts (HumanHandoverMeeting.goal, input).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHandover.IPerson, IAutoMovieMotionHumanProp, IAutoMovieMotionHumanProp.IFrame, IAutoMovieMotionHumanHandover.Outcome, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IInput {
    /** The giver, holding the prop in its acting hand. */
    giver: IAutoMovieMotionHumanHandover.IPerson;

    /** The receiver. */
    receiver: IAutoMovieMotionHumanHandover.IPerson;

    /** The prop. */
    prop: IAutoMovieMotionHumanProp;

    /** The prop's displayed frame at the start. */
    frame: IAutoMovieMotionHumanProp.IFrame;

    /** The receiver's grip affordance id. */
    handle: string;

    /** The prop's mass, kilograms; 0.09 when absent. */
    mass?: number;

    /** The outcome; `transfer` when absent. */
    outcome?: IAutoMovieMotionHumanHandover.Outcome;

    /** Where the receiving grip is handed over, world metres, as the partners' meeting places it (`HumanHandoverMeeting`); the standing pair's mutual goal when absent. */
    meet?: IAutoMovieVector3;
  }

  /**
   * The shared plan; every time is seconds from the handover's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation transfer: Both hands' shared hold.
   * @evidence contracts/development/design.md#principled-representation transfer: Both hands' shared hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanHandover.ts (HumanHandover.plan, return); handling/handOver.ts (handOver.plan); handling/receive.ts (receive.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHandover.Outcome, IAutoMovieMotionHumanHand.IWrist, IAutoMovieMotionHumanProp.IFrame, IAutoMovieMotionHumanGrasp.ITarget, IAutoMovieMotionHumanPosture.IReference identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPlan {
    /** The outcome. */
    outcome: IAutoMovieMotionHumanHandover.Outcome;

    /** Where the giver's hand starts. */
    giverFrom: IAutoMovieMotionHumanHand.IWrist;

    /** Where the giver's hand offers the prop. */
    giverAt: IAutoMovieMotionHumanHand.IWrist;

    /** The prop's frame at the offer. */
    offered: IAutoMovieMotionHumanProp.IFrame;

    /** Where the receiver's hand starts. */
    receiverFrom: IAutoMovieMotionHumanHand.IWrist;

    /** The receiver's grasp target on the offered prop. */
    target: IAutoMovieMotionHumanGrasp.ITarget;

    /** The receiver's wrist at the grasp. */
    receiverAt: IAutoMovieMotionHumanHand.IWrist;

    /** The receiver's hand as its arm achieves the grasp, where the digits close. */
    receiverShown: IAutoMovieMotionHumanHand.IWrist;

    /** The receiver's arm solution at the grasp, which its hold and take-away keep. */
    receiverReference: IAutoMovieMotionHumanPosture.IReference;

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
