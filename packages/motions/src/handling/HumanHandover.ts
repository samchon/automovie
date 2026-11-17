import {
  Quaternion,
  Vector3,
  resolveAutoMovieMutualGoal,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHandover,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGrasp } from "./HumanGrasp";
import { HumanHandoverMeeting } from "./HumanHandoverMeeting";
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

  /**
   * Plan a handover.
   *
   * @param input Both people, the prop and the outcome.
   * @returns The plan.
   * @throws {Error} When the partners stand beyond reach of each other or the prop lacks the receiving grip.
   */
  export function plan(
    input: IAutoMovieMotionHumanHandover.IInput,
  ): IAutoMovieMotionHumanHandover.IPlan {
    const outcome: IAutoMovieMotionHumanHandover.Outcome =
      input.outcome ?? "transfer";
    const giver = input.giver.bones;
    const receiver = input.receiver.bones;
    const hand = (
      bones: IAutoMovieMotionHumanHandover.IPerson["bones"],
      side: IAutoMovieMotionHumanHand.Side,
    ): IAutoMovieMotionHumanHand.IWrist => {
      const b = bones.get(`${side}Hand`)!;
      return { point: b.worldPosition, rotation: b.worldRotation };
    };
    const giverFrom: IAutoMovieMotionHumanHand.IWrist = hand(
      giver,
      input.giver.side,
    );
    const receiverFrom: IAutoMovieMotionHumanHand.IWrist = hand(
      receiver,
      input.receiver.side,
    );

    // Where: the receiving grip on the mutual goal, the prop turned as held,
    // its middle at the exchange share of the mean sternum height.
    const atStart: IAutoMovieMotionHumanGrasp.ITarget = HumanGrasp.at(
      input.prop,
      input.handle,
      input.frame,
    );
    const meet: IAutoMovieVector3 =
      input.meet ??
      resolveAutoMovieMutualGoal(HumanHandoverMeeting.goal(input, EXCHANGE))
        .point;
    const shift: IAutoMovieVector3 = Vector3.subtract(meet, atStart.point);
    const offered: IAutoMovieMotionHumanProp.IFrame = {
      position: Vector3.add(input.frame.position, shift),
      rotation: input.frame.rotation,
    };
    const giverAt: IAutoMovieMotionHumanHand.IWrist = {
      point: Vector3.add(giverFrom.point, shift),
      rotation: giverFrom.rotation,
    };
    // The receiver takes the grip from the azimuth about its axis its arm can
    // reach from standing, as a pick up does, and can still hold as it took
    // it at the place it then carries the prop to, so the prop is not tipped
    // on the way there.
    const authored: IAutoMovieMotionHumanGrasp.ITarget = HumanGrasp.at(
      input.prop,
      input.handle,
      offered,
    );
    const standing: IAutoMovieMotionHumanPosture = HumanGrasp.standing(
      input.receiver.body,
      receiver,
    );
    const chosen: IAutoMovieMotionHumanGrasp.IReach = HumanGrasp.reachable(
      input.receiver.body,
      standing,
      input.receiver.side,
      AutoMovieMotionHumanBend.hang(
        input.receiver.body,
        standing,
        input.receiver.side,
      ),
      (turn: number): IAutoMovieMotionHumanHand.IWrist =>
        HumanGrasp.hand(
          input.receiver.body,
          input.receiver.side,
          HumanGrasp.around(authored, turn),
        ),
      [0],
      (
        wrist: IAutoMovieMotionHumanHand.IWrist,
      ): IAutoMovieMotionHumanGrasp.IKey[] => [
        {
          posture: standing,
          wrist: {
            point: carried(input.receiver.body, standing, input.receiver.side),
            rotation: wrist.rotation,
          },
          bend: AutoMovieMotionHumanBend.hang(
            input.receiver.body,
            standing,
            input.receiver.side,
          ),
        },
      ],
    );
    const target: IAutoMovieMotionHumanGrasp.ITarget = HumanGrasp.around(
      authored,
      chosen.turn,
    );
    const receiverAt: IAutoMovieMotionHumanHand.IWrist = chosen.wrist;
    const receiverShown: IAutoMovieMotionHumanHand.IWrist = chosen.shown;

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
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: IAutoMovieMotionHumanHand.Side,
    pitch: number = 0,
  ): IAutoMovieVector3 {
    const raised: number = (pitch * Math.PI) / 180;
    const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(body, posture).get(
      `${side}UpperArm`,
    )!.worldPosition;
    return HumanFrame.point(
      {
        origin: {
          x: shoulder.x,
          y: shoulder.y - body.measure.upperArm,
          z: shoulder.z,
        },
        yaw: posture.yaw,
      },
      {
        x: 0,
        y: body.measure.forearm * Math.sin(raised),
        z: body.measure.forearm * Math.cos(raised),
      },
    );
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
   * @evidence contracts/development/implementation.md#efficient-algorithms Nine posture resolves per instant, one instant per `STEP` of the path, at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by the giver's offer and the receiver's take-away, the two upright carries of a handover.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned function closes over the chosen turns.
   */
  export function upright(
    body: IAutoMovieMotionHumanBody,
    side: IAutoMovieMotionHumanHand.Side,
    at: (seconds: number, yaw: number) => IAutoMovieMotionHumanPosture,
    from: number,
    to: number,
    ends: readonly [number, number | undefined],
  ): (seconds: number) => number {
    const count: number = Math.max(1, Math.ceil((to - from) / STEP - 1e-9));
    const tip = (seconds: number, yaw: number): number =>
      tipped(body, side, at(seconds, yaw));
    const times: number[] = [from];
    const turns: number[] = [ends[0]];
    for (let k: number = 1; k <= count; k++) {
      const seconds: number = from + ((to - from) * k) / count;
      times.push(seconds);
      if (k === count && ends[1] !== undefined) {
        turns.push(ends[1]);
        continue;
      }
      const before: number = turns.at(-1)!;
      let best: number = before;
      let least: number = Infinity;
      for (const yaw of YAWS) {
        const cost: number = tip(seconds, yaw) + 0.1 * Math.abs(yaw - before);
        if (cost < least - 1e-9) {
          least = cost;
          best = yaw;
        }
      }
      turns.push(best);
    }
    return (seconds: number): number => {
      if (!(seconds > from)) return turns[0]!;
      for (let k: number = 1; k < times.length; k++)
        if (seconds <= times[k]!)
          return (
            turns[k - 1]! +
            ((turns[k]! - turns[k - 1]!) * (seconds - times[k - 1]!)) /
              (times[k]! - times[k - 1]!)
          );
      return turns.at(-1)!;
    };
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
    body: IAutoMovieMotionHumanBody,
    side: IAutoMovieMotionHumanHand.Side,
    posture: IAutoMovieMotionHumanPosture,
  ): number {
    const asked: IAutoMovieQuaternion | undefined =
      posture.limbs[side === "left" ? "leftArm" : "rightArm"]?.rotation;
    const reached: IAutoMovieQuaternion | undefined = poseBones(
      body,
      resolveHumanPosture(body, posture),
    ).get(`${side}Hand`)?.worldRotation;
    if (asked === undefined || reached === undefined) return Infinity;
    const off: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.normalize(reached),
      Quaternion.inverse(Quaternion.normalize(asked)),
    );
    return (
      (Math.acos(
        Math.max(
          -1,
          Math.min(1, Quaternion.rotateVector(off, { x: 0, y: 1, z: 0 }).y),
        ),
      ) *
        180) /
      Math.PI
    );
  }
}
