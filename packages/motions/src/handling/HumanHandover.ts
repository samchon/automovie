import {
  type IAutoMovieResolvedBone,
  Vector3,
  resolveAutoMovieMutualGoal,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGraspTarget } from "./HumanGraspTarget";
import { HumanHandoverMeeting } from "./HumanHandoverMeeting";
import { HumanHandoverUpright } from "./HumanHandoverUpright";
import { HumanPrehension } from "./HumanPrehension";

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

    /** Where the receiving grip is handed over, world metres, as the partners' meeting places it (`HumanHandoverMeeting`); the standing pair's mutual goal when absent. */
    meet?: IAutoMovieVector3;
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation The namespace defines both bodies, displayed starting bones, held prop and exchange timing; this method returns their common chosen receiver grip and original transfer schedule.
   * @evidence contracts/development/implementation.md#principled-implementation The same mutual exchange point translates the held prop, and the original full grasp search ranks each receiver turn against both the offered grip and its actual upright carry key.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Incoming frame, mutual goal and offered frame precede one receiver grip search and the original timing policy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All candidate turns, actual coupled fits, original required keys, strict comparisons, mass-dependent transfer and refusal paths remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed receiver carry wrist and hanging elbow are read once rather than once per reached candidate key; the incoming point uses the narrow prepared grasp frame and only the offered target wraps colliders. Every actual numerical candidate fit remains.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One unchanged prop/handle/frame family and receiver standing body establish fixed geometry; each candidate retains its actual wrist rotation, keys and scores without a result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local grasp preparation and carry geometry live through this synchronous search; the result retains existing frame, target, wrist, reference and scalar timing records, with no search workspace, FK reader, candidate history or handle.
   */
  export function plan(input: IInput): IPlan {
    const outcome: Outcome = input.outcome ?? "transfer";
    const giver: IPerson["bones"] = input.giver.bones;
    const receiver: IPerson["bones"] = input.receiver.bones;
    const hand: (bones: IPerson["bones"], side: HumanHand.Side) => HumanHand.IWrist = (
      bones: IPerson["bones"],
      side: HumanHand.Side,
    ): HumanHand.IWrist => {
      const b: Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation"> = bones.get(`${side}Hand`)!;
      return { point: b.worldPosition, rotation: b.worldRotation };
    };
    const giverFrom: HumanHand.IWrist = hand(giver, input.giver.side);
    const receiverFrom: HumanHand.IWrist = hand(receiver, input.receiver.side);

    // Where: the receiving grip on the mutual goal, the prop turned as held,
    // its middle at the exchange share of the mean sternum height.
    const handle: ReturnType<typeof HumanGraspTarget> = HumanGraspTarget(input.prop, input.handle);
    const atStart: HumanGrasp.IFrame = handle.frame(input.frame);
    const meet: IAutoMovieVector3 =
      input.meet ??
      resolveAutoMovieMutualGoal(HumanHandoverMeeting.goal(input, EXCHANGE))
        .point;
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
    // reach from standing, as a pick up does, and can still hold as it took
    // it at the place it then carries the prop to, so the prop is not tipped
    // on the way there.
    const authored: HumanGrasp.ITarget = handle.at(offered);
    const standing: IHumanPosture = HumanGrasp.standing(
      input.receiver.body,
      receiver,
    );
    const place: ReturnType<typeof HumanGrasp.prepareHand> =
      HumanGrasp.prepareHand(input.receiver.body, input.receiver.side);
    const carriedPoint: IAutoMovieVector3 = carried(input.receiver.body, standing, input.receiver.side);
    const hang: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      input.receiver.body, standing, input.receiver.side,
    );
    const chosen: HumanGrasp.IReach = HumanGrasp.reachable(
      input.receiver.body,
      standing,
      input.receiver.side,
      hang,
      (turn: number): HumanHand.IWrist =>
        place(HumanGrasp.around(authored, turn)),
      [0],
      (wrist: HumanHand.IWrist): HumanGrasp.IKey[] => [
        {
          posture: standing,
          wrist: {
            point: carriedPoint,
            rotation: wrist.rotation,
          },
          bend: hang,
        },
      ],
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

  /**
   * Where a hand carries what it took: the wrist a forearm ahead of the
   * elbow that hangs under the shoulder, the forearm level or raised by a
   * pitch.
   *
   * @param body The body.
   * @param posture The posture the shoulder is read on.
   * @param side The hand.
   * @param pitch How far the forearm is raised above level, degrees; 0 when absent.
   * @returns The wrist's place, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the place, what it is read on and the frame of the result.
   * @evidence contracts/development/implementation.md#principled-implementation The elbow at the side with the forearm level is the carrying posture of a light object; both lengths are the body's own.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shoulder read and one point in the posture's heading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No metre constant: the upper arm and the forearm are the body's measures.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by the receiver's plan for its carry and by the grip choice as a key pose, so both mean one place.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function carried(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    pitch: number = 0,
  ): IAutoMovieVector3 {
    const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(body, posture, undefined, undefined, new Set<AutoMovieHumanoidBone>([`${side}UpperArm`])).get(
      `${side}UpperArm`,
    )!.worldPosition;
    return carriedAt(shoulder, posture.yaw, body.measure.upperArm, body.measure.forearm, pitch);
  }

  /**
   * Prepare one unchanged posture's carrying places for actual forearm pitches.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes unchanged body/rig/ROM and full source posture for one synchronous carry-place search; each degree pitch returns a fresh original world-metre wrist point.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the actual demanded shoulder once, then applies carried's same shoulder-minus-upper-arm floor origin and raised-forearm sine/cosine point for each pitch.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed shoulder/yaw/body lengths feed the shared carriedAt numerical owner used by the cold carried facade.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No limb goal, shoulder point, arm-length measure, pitch, trigonometric grouping or original carrying share is changed; a changed fixed posture/body requires new preparation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One actual demanded shoulder reading replaces C repeated readings for a fixed carry-place search; each requested pitch still computes its original world point. Runtime gain is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Receive's pitch search explicitly retains one held posture/body while pitch alone varies; cold and prepared paths share one original point formula without caching candidates or fit answers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one private copied shoulder and yaw/length scalars until search release; returned points are fresh and retain no body/posture, FK reader, history or handle.
   */
  export function prepareCarried(body: IHumanBody, posture: IHumanPosture,
    side: HumanHand.Side): (pitch?: number) => IAutoMovieVector3 {
    const shoulder: IAutoMovieVector3 = { ...HumanTrunk.resolve(body, posture, undefined, undefined,
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`])).get(`${side}UpperArm`)!.worldPosition };
    const yaw: number = posture.yaw;
    const upper: number = body.measure.upperArm;
    const forearm: number = body.measure.forearm;
    return (pitch: number = 0): IAutoMovieVector3 => carriedAt(shoulder, yaw, upper, forearm, pitch);
  }

  /** The longest interval between two instants an upright carry's turn is chosen at, seconds (provisional: a carry's arm changes its best turn over about a tenth of a second). */
  export const STEP: number = 0.1;

  /** The turns about the world's up an upright carry is tried at, degrees, nearest first (provisional: a sixth of a turn either way in steps of 15; a wider set chose turns whose linear way between two instants tipped the prop more). */
  export const YAWS: readonly number[] = [
    0, 15, -15, 30, -30, 45, -45, 60, -60,
  ];

  /**
   * The turn about the world's up an upright carry takes along a path: a
   * hand that holds a vessel upright keeps one freedom, the turn about the
   * vertical, and the arm meets some turns of it with the vessel upright and
   * others only by tipping it. At instants of the path no more than `STEP`
   * apart the turn of
   * `YAWS` the arm meets with the least tip is chosen, each a little held to
   * the one before (a tenth of a degree of tip per degree of change), and
   * the turn runs linearly between them; the path's two ends keep the turns
   * given for them.
   *
   * @param body The body.
   * @param side The hand.
   * @param at The posture at a second of the path with the hand turned by a yaw, degrees, about the world's up from its upright rotation there.
   * @param from The path's first second.
   * @param to The path's last second.
   * @param ends The turns at the two ends, degrees; a missing end is chosen as the instants between are.
   * @returns The turn at a second, degrees; the first end's before the path and the last instant's after it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the freedom, how each instant's turn is chosen, how the turn runs between them and what the ends keep.
   * @evidence contracts/development/implementation.md#principled-implementation An upright vessel's rotation is fixed up to a turn about the vertical, so that turn is the arm's to choose; the tip is read as the asked rotation's error applied to the world's up, the only error that spills what the hand holds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A fixed number of instants, a fixed set of turns, one linear interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The turn is chosen at plan time and is a function of time alone, never of a previous frame.
   * @evidence contracts/development/implementation.md#efficient-algorithms Nine posture resolves per instant, one instant per STEP of the path, at plan time; each later read finds the original inclusive enclosing interval in O(log K) comparisons and uses the unchanged linear interpolation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by the giver's offer and the receiver's take-away, the two upright carries of a handover.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned function retains K times and K scalar turns until its action is released; actual sample postures and solver workspaces are not captured or retained.
   */
  export function upright(
    body: IHumanBody,
    side: HumanHand.Side,
    at: (seconds: number, yaw: number) => IHumanPosture,
    from: number,
    to: number,
    ends: readonly [number, number | undefined],
  ): (seconds: number) => number {
    return HumanHandoverUpright.ordinary(body, side, at, from, to, ends);
  }

  /**
   * How far a posture tips what its hand holds upright: the angle the hand's
   * asked rotation, as the arm reaches it, turns the world's up through.
   *
   * @param body The body.
   * @param side The hand.
   * @param posture The posture, whose arm goal asks the hand's rotation.
   * @returns Degrees; infinite when the goal asks no rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is measured and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The asked rotation holds the prop upright, so the reached rotation's error from it, applied to the world's up, is the tip and nothing else.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolve, one quotient, one angle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A goal with no rotation is not upright by anything, so it reads as infinitely tipped.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by `upright` along a path and by the receiver's choice of its carrying place.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One posture resolve.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function tipped(
    body: IHumanBody,
    side: HumanHand.Side,
    posture: IHumanPosture,
  ): number {
    const asked: IAutoMovieQuaternion | undefined =
      posture.limbs[side === "left" ? "leftArm" : "rightArm"]?.rotation;
    const reached: IAutoMovieQuaternion | undefined = poseBones(
      body,
      resolveHumanPosture(body, posture),
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
    ).get(`${side}Hand`)?.worldRotation;
    return HumanHandoverUpright.angle(asked, reached);
  }
}

/** Original carry place, kept numerically identical for cold and fixed-source readers. */
function carriedAt(shoulder: IAutoMovieVector3, yaw: number, upper: number,
  forearm: number, pitch: number): IAutoMovieVector3 {
  const raised: number = (pitch * Math.PI) / 180;
  return HumanFrame.point({ origin: { x: shoulder.x, y: shoulder.y - upper, z: shoulder.z }, yaw },
    { x: 0, y: forearm * Math.sin(raised), z: forearm * Math.cos(raised) });
}
