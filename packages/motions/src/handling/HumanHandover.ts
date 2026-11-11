import {
  type IAutoMovieResolvedBone,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
  resolveAutoMovieMutualGoal,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanGrasp } from "./HumanGrasp";
import { HumanPrehension } from "./HumanPrehension";
import { handshake } from "./handshake";

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
 *   sternum height, moved only as far as both arms' reach demands. The object
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
 * @evidence contracts/development/common.md#meaningful-documentation States the location and timing laws with their sources, the shared-computation premise, and each outcome.
 * @evidence contracts/development/implementation.md#principled-implementation Mutual goal location, reach-to-grasp movement times, and the measured transfer times interpolated by mass.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure planner both laws call with the same inputs.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The release is scheduled after the receiver's grip by construction, not by a tolerance; a drop is refused rather than faked without physics.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work on bones the caller resolved.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each law computes it once at planning.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns plain data.
 */
export namespace HumanHandover {
  /**
   * The height of the handed object's middle as a share of the partners' mean
   * sternum height: human pairs exchange an object at about 0.9 of chest
   * height (Khanna, Björkman and Smith 2023, arXiv 2304.02154, fig. 12).
   * Reading their chest marker as this rig's sternum region is provisional.
   */
  export const EXCHANGE: number = 0.9;

  /** How the handover ends. */
  export type Outcome = "transfer" | "withdraw" | "decline";

  /** One side's state at the start. */
  export interface IPerson {
    /** The body. */
    body: IHumanBody;

    /** The acting hand. */
    side: HumanHand.Side;

    /** The person's displayed world bones at the start. */
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >;
  }

  /** The planner's input. */
  export interface IInput {
    /** The giver, holding the prop in its acting hand. */
    giver: IPerson;

    /** The receiver. */
    receiver: IPerson;

    /** The prop. */
    prop: IHumanProp;

    /** The prop's displayed frame at the start. */
    frame: IHumanProp.IFrame;

    /** The receiver's grip affordance id. */
    handle: string;

    /** The prop's mass, kilograms; 0.09 when absent. */
    mass?: number;

    /** The outcome; `transfer` when absent. */
    outcome?: Outcome;
  }

  /** The shared plan; every time is seconds from the handover's start. */
  export interface IPlan {
    /** The outcome. */
    outcome: Outcome;

    /** Where the giver's hand starts. */
    giverFrom: HumanHand.IWrist;

    /** Where the giver's hand offers the prop. */
    giverAt: HumanHand.IWrist;

    /** The prop's frame at the offer. */
    offered: IHumanProp.IFrame;

    /** Where the receiver's hand starts. */
    receiverFrom: HumanHand.IWrist;

    /** The receiver's grasp target on the offered prop. */
    target: HumanGrasp.ITarget;

    /** The receiver's wrist at the grasp. */
    receiverAt: HumanHand.IWrist;

    /** The receiver's hand as its arm achieves the grasp, where the digits close. */
    receiverShown: HumanHand.IWrist;

    /** The receiver's arm solution at the grasp, which its hold and take-away keep. */
    receiverReference: IHumanPosture.IReference;

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

  /**
   * Plan a handover.
   *
   * @param input Both people, the prop and the outcome.
   * @returns The plan.
   * @throws {Error} When the partners stand beyond reach of each other or the prop lacks the receiving grip.
   */
  export function plan(input: IInput): IPlan {
    const outcome: Outcome = input.outcome ?? "transfer";
    const giver = input.giver.bones;
    const receiver = input.receiver.bones;
    const hand = (
      bones: IPerson["bones"],
      side: HumanHand.Side,
    ): HumanHand.IWrist => {
      const b = bones.get(`${side}Hand`)!;
      return { point: b.worldPosition, rotation: b.worldRotation };
    };
    const giverFrom: HumanHand.IWrist = hand(giver, input.giver.side);
    const receiverFrom: HumanHand.IWrist = hand(receiver, input.receiver.side);

    // Where: the receiving grip on the mutual goal, the prop turned as held,
    // its middle at the exchange share of the mean sternum height.
    const atStart: HumanGrasp.ITarget = HumanGrasp.at(
      input.prop,
      input.handle,
      input.frame,
    );
    const sternum = (person: IPerson): number =>
      resolveAutoMovieHumanoidSurfaces.place(
        person.body.surfaces.regions.sternum,
        person.bones.get(person.body.surfaces.regions.sternum.bone)!,
      ).point.y;
    const [bottom, top]: readonly [number, number] = HumanGrasp.span(
      atStart.colliders,
      { x: 0, y: 1, z: 0 },
    );
    const meet: IAutoMovieVector3 = resolveAutoMovieMutualGoal({
      height:
        (EXCHANGE * (sternum(input.giver) + sternum(input.receiver))) / 2 -
        ((bottom + top) / 2 - atStart.point.y),
      a: handshake.arm(
        input.giver.body,
        input.giver.side,
        giver.get(`${input.giver.side}UpperArm`)!.worldPosition,
      ),
      b: handshake.arm(
        input.receiver.body,
        input.receiver.side,
        receiver.get(`${input.receiver.side}UpperArm`)!.worldPosition,
      ),
    }).point;
    const shift: IAutoMovieVector3 = Vector3.subtract(meet, atStart.point);
    const offered: IHumanProp.IFrame = {
      position: Vector3.add(input.frame.position, shift),
      rotation: input.frame.rotation,
    };
    const giverAt: HumanHand.IWrist = {
      point: Vector3.add(giverFrom.point, shift),
      rotation: giverFrom.rotation,
    };
    // The receiver takes the grip from the azimuth about its axis its arm can
    // reach from standing, as a pick up does.
    const authored: HumanGrasp.ITarget = HumanGrasp.at(
      input.prop,
      input.handle,
      offered,
    );
    const standing: IHumanPosture = HumanGrasp.standing(
      input.receiver.body,
      receiver,
    );
    const chosen: HumanGrasp.IReach = HumanGrasp.reachable(
      input.receiver.body,
      standing,
      input.receiver.side,
      AutoMovieMotionHumanBend.hang(input.receiver.body, standing, input.receiver.side),
      (turn: number): HumanHand.IWrist =>
        HumanGrasp.hand(
          input.receiver.body,
          input.receiver.side,
          HumanGrasp.around(authored, turn),
        ),
    );
    const target: HumanGrasp.ITarget = HumanGrasp.around(authored, chosen.turn);
    const receiverAt: HumanHand.IWrist = chosen.wrist;
    const receiverShown: HumanHand.IWrist = chosen.shown;

    // When: the giver's offer, the receiver's reach ending no earlier, the
    // shared hold by mass, then the release.
    const offer: number = HumanPrehension.carry(Vector3.length(shift));
    const reach: number = HumanPrehension.nominal(
      Vector3.length(Vector3.subtract(receiverAt.point, receiverFrom.point)),
      target.width,
    );
    const reachStart: number = Math.max(0, offer - reach);
    const gripClosed: number = reachStart + reach;
    const mass: number = input.mass ?? 0.09;
    const share: number = Math.min(
      1,
      Math.max(0, (mass - 0.09) / (1.8 - 0.09)),
    );
    const transfer: number = 0.5 + share * (0.64 - 0.5);
    return {
      outcome,
      giverFrom,
      giverAt,
      offered,
      receiverFrom,
      target,
      receiverAt,
      receiverShown,
      receiverReference: chosen.reference,
      offer,
      reachStart,
      reach,
      gripClosed,
      transfer,
      release: gripClosed + transfer,
    };
  }
}
