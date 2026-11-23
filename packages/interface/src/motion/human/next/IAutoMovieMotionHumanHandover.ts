import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanGrasp } from "../handling/IAutoMovieMotionHumanGrasp";
import type { IAutoMovieMotionHumanHandoverAction } from "../handling/IAutoMovieMotionHumanHandoverAction";
import type { IAutoMovieMotionHumanHandshake } from "../handling/IAutoMovieMotionHumanHandshake";
import type { IAutoMovieMotionHumanReceive } from "../handling/IAutoMovieMotionHumanReceive";
import type { IAutoMovieMotionHumanRelayPass } from "../handling/IAutoMovieMotionHumanRelayPass";
import type { IAutoMovieMotionHumanProp } from "../perform/IAutoMovieMotionHumanProp";
import type { IAutoMovieHumanLimbReference } from "../posture/IAutoMovieHumanLimbReference";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";

/**
 * Passing an object between two people: giving, receiving, relaying and the
 * handshake.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanHandover` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanHandover<Chain> {
  /**
   * The giver's authored parameters for offering a held prop to a receiver.
   *
   * @param params The `prop`, `to`, `handle`, `hand`, `receiverHand`, `mass`
   *   and `outcome` of `IAutoMovieMotionHumanHandoverAction.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  handOver(
    params: IAutoMovieMotionHumanHandoverAction.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Taking a prop a giver holds out: the receiver's half of a handover.
   *
   * @param params The `prop`, `partner`, `handle`, `hand`, `giverHand`, `mass`
   *   and `outcome` of `IAutoMovieMotionHumanReceive.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  receive(params: IAutoMovieMotionHumanReceive.IParams, anchor?: string): Chain;

  /**
   * A relay baton pass, one role of it, performed over a run
   * (`HumanChain.over`): the outgoing runner's hand goes back, open, palm back,
   * and the incoming runner pushes the baton's end into it at a film second
   * both roles state alike (`at`), from where the baton passes to the outgoing
   * hand.
   *
   * Registered law: `registered("relayPass", params)`; not a chain method.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims one arm and its hand when performed over a run; it can be cut into
   * any action from its `relax` instant.
   *
   * @param params The `role`, `partner`, `at`, `baton`, `end`, `hand` and
   *   `zone` of `IAutoMovieMotionHumanRelayPass.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  relayPass(
    params: IAutoMovieMotionHumanRelayPass.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Shaking hands with a partner: both bring the same hand's palm to one shared
   * point, clasp, pump together and let go.
   *
   * @param params The `partner`, `hand` and `count` of
   *   `IAutoMovieMotionHumanHandshake.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  handshake(
    params: IAutoMovieMotionHumanHandshake.IParams,
    anchor?: string,
  ): Chain;
}

/**
 * The shared plan of one object passing from a giver's hand to a receiver's:
 * where it is handed over, when each hand moves, when the receiver's grip
 * closes and when the giver lets go.
 *
 * Both the giver's and the receiver's laws compute this same plan from the same
 * inputs (both bodies, both people's displayed bones at the start and the
 * prop's frame there), so the two hands agree without either reading the
 * other's moving plan, and the giver's release follows the receiver's grip by
 * construction.
 *
 * - Where: the object's receiving grip lands on the mutual goal of the giver's
 *   and the receiver's acting shoulders (`resolveAutoMovieMutualGoal` with the
 *   handshake's comfortable reach): handovers take place midway between the
 *   partners (Hansen et al. 2017, reviewed by Kopnarski et al. 2023), with the
 *   object's middle at {@link EXCHANGE} of the partners' mean sternum height,
 *   moved only as far as both arms' reach demands
 *   (`HumanHandoverMeeting.goal`). Both laws read the place from the one
 *   meeting record (`HumanHandoverMeeting`, `meet`), where a seated pair leans
 *   its trunks when the arms alone fall short. The object keeps the orientation
 *   the giver holds it in, so the receiver grasps the grip its author named as
 *   the one offered.
 * - When: the giver's transport takes the loaded-carry time over its travel
 *   (`HumanPrehension.carry`); the receiver's reach, timed for its travel and
 *   the grasped width, starts so it ends no earlier than the giver's (the
 *   receiver begins reaching during the giver's transport, Kopnarski 2023), and
 *   its grip closes at `gripClosed`. Both hands then hold the object for the
 *   transfer time, 0.5 s for 90 g (Mason and MacKenzie 2005, Exp. Brain Res.
 *   163:173) to 0.64 s for 1.8 kg (Doehring et al. 2020), linear in mass
 *   between and held at the ends outside, and only then does the giver open:
 *   the giver releases as the receiver takes the load (Mason and MacKenzie
 *   2005; Controzzi et al. 2018), never before `gripClosed`.
 *
 * Outcomes other than a transfer reuse the same where and when: `withdraw`
 * pulls the offer back as the receiver's hand comes within its approach
 * setback, so the receiver's hand stops short and returns; `decline` leaves the
 * receiver's hand where it is and the giver withdraws after the transfer time.
 * A drop needs the physics layer to carry the falling object and is not
 * offered.
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
