import {
  type IAutoMovieResolvedBone,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { HumanPreshape } from "./HumanPreshape";

/**
 * Reaching for a prop's grip, grasping it and lifting it clear.
 *
 * The goal is the grip, not the arm: the hand's grip socket is brought onto
 * the prop's grip affordance along its approach axis (`HumanGrasp`), taken
 * from the azimuth about the grip's axis (within 90 degrees of the authored
 * approach), tilted up to 45 degrees into an oblique grip, that the arm can
 * reach with the least wrist error, the
 * fingers open to the peak aperture on the way and close on the prop's
 * colliders until contact (`HumanGrip`), and inverse kinematics solves the
 * arm. The rest of the body holds the posture it was entered in, so a pick
 * up continues a stand or the deepest point of a bend with its feet planted,
 * and only the reaching arm and its fingers move.
 *
 * Phases:
 *
 * 1. Reach: the reach-to-grasp transport (`HumanPrehension`): the
 *    two-factor movement time of McIntosh et al. (2018) for the wrist's travel
 *    and the grasped width, with the performer's timing variability; the
 *    hand comes in the last stretch along the approach axis from a setback
 *    equal to the peak aperture, so the open hand clears the object, and the
 *    aperture peaks inside Jeannerod's 60 to 70 % band.
 * 2. Load: the hand holds still for 0.15 s with the fingers closed, the
 *    preload and load phases that precede lift-off in a precision lift
 *    (Johansson and Westling 1984, Exp. Brain Res. 56:550); the duration is
 *    provisional, as the phase durations themselves were not reached.
 * 3. Lift: the wrist rises `lift` metres (0.1 m when absent, provisional:
 *    about a hand's breadth clear of the support) on a minimum-jerk profile
 *    timed by the same movement-time law.
 *
 * The hand grips the prop from `gripClosed` to the end, which attaches the
 * prop to the hand (`HumanPerformance.prop`), so the prop rides the lift, and
 * the plan declares a hold from `gripClosed`, so the hand keeps the prop with
 * its closed fingers through later actions (carried with the trunk while a
 * walk or a turn drives the body) until a put down or a hand over takes it.
 *
 * Events: `gripClosed`, `liftOff`, `lifted`. A pick up cut into a stand
 * before `gripClosed` abandons the reach; after `lifted` it continues into a
 * stand, a walk, a put down or a hand over. A grip beyond the arm's straight
 * reach from its shoulder is refused with both distances: the author bends or
 * steps first.
 */
export namespace pickUp {
  /** The action's name. */
  export const name: HumanActionName = "pickUp";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: [0, "gripClosed"], kind: "inertialize", entry: 0, blend: 0.3 },
      {
        window: ["lifted", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
        keep: ["grip"],
      },
    ],
    walk: [
      {
        window: ["lifted", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
        keep: ["grip"],
      },
    ],
  };

  /** Parameters. */
  export interface IParams {
    /** The prop's subject id. */
    prop: string;

    /** The grip affordance's id. */
    handle: string;

    /** The grasping hand; `right` when absent. */
    hand?: HumanHand.Side;

    /** How far the wrist rises after the grasp, metres; 0.1 when absent. */
    lift?: number;
  }

  /** The load phase between contact and lift-off, seconds; provisional. */
  export const LOAD: number = 0.15;

  /**
   * Plan a pick up.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the grip lies beyond the arm's reach, or the prop has no such affordance or no colliders.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const side: HumanHand.Side = context.params.hand ?? "right";
    const lift: number = context.params.lift ?? 0.1;
    if (!(lift >= 0)) throw new Error("A pick up lifts a non-negative height");
    const body: IHumanBody = context.body;
    const held: IHumanPosture = context.entry.posture;

    // The grasp: where the hand goes, how it opens and how it closes.
    // The grip is taken from the side of its axis the arm can reach with the
    // hand turned as asked (a cylinder grips alike from any azimuth).
    const authored: HumanGrasp.ITarget = HumanGrasp.target(
      context,
      context.params.prop,
      context.params.handle,
      context.start,
    );
    // The same grip must still hold at the top of the lift, so the lifted
    // pose is a key of the choice.
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      held,
      side,
    );
    const chosen: HumanGrasp.IReach = HumanGrasp.reachable(
      body,
      held,
      side,
      bend,
      (turn: number, tilt: number): HumanHand.IWrist =>
        HumanGrasp.hand(body, side, HumanGrasp.around(authored, turn), tilt),
      [-45, -30, -15, 0, 15, 30, 45],
      (wrist: HumanHand.IWrist): HumanGrasp.IKey[] =>
        lift > 0
          ? [
              {
                posture: held,
                wrist: {
                  point: { ...wrist.point, y: wrist.point.y + lift },
                  rotation: wrist.rotation,
                },
                bend,
              },
            ]
          : [],
    );
    const target: HumanGrasp.ITarget = HumanGrasp.around(authored, chosen.turn);
    const grasp: HumanHand.IWrist = chosen.wrist;
    pickUp.reachable(context, side, grasp.point);

    // The digits close on the prop where the arm actually puts the hand.
    const closed: IHumanPosture["joints"] = HumanGrip.close(
      body,
      side,
      target.grip,
      chosen.shown,
      target.colliders,
    ).joints;
    const open: IHumanPosture["joints"] = HumanPreshape.open(
      body,
      side,
      closed,
      target.width,
    ).joints;
    const entry: IAutoMovieResolvedBone = poseBones(
      body,
      context.entry.pose,
    ).get(`${side}Hand`)!;

    // Timing: reach, load, lift.
    const reach: number = HumanPrehension.duration(
      context.skill,
      context.random("reach"),
      Vector3.length(Vector3.subtract(grasp.point, entry.worldPosition)),
      target.width,
    );
    const rise: number = lift > 0 ? HumanPrehension.nominal(lift, 0) : 0;
    const duration: number = reach + LOAD + rise;
    const transport: HumanPrehension.ITransport = HumanPrehension.transport(
      entry.worldPosition,
      grasp.point,
      target.approach,
      HumanPrehension.aperture(target.width),
      { from: entry.worldRotation, to: grasp.rotation },
      reach,
    );
    const peak: number = HumanPrehension.peak(context.random("peak"));
    const shapes = {
      entry: HumanGrip.fingers(context.entry.pose, side),
      open,
      closed,
    };
    const limb: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";
    const hand: IHumanContactWindow["part"] =
      side === "left" ? "leftHand" : "rightHand";
    return {
      duration,
      events: [
        { name: "gripClosed", share: reach / duration },
        { name: "liftOff", share: (reach + LOAD) / duration },
        { name: "lifted", share: 1 },
      ],
      contacts: [
        {
          part: "leftFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: hand,
          kind: "grip",
          from: reach / duration,
          to: 1,
          support: { kind: "prop", subject: context.params.prop },
        },
      ],
      holds: [
        {
          side,
          prop: context.params.prop,
          from: reach / duration,
          fingers: closed,
        },
      ],
      contact: reach,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const up: number =
          rise > 0 ? lift * minimumJerk((t - reach - LOAD) / rise).s : 0;
        const wrist: IAutoMovieVector3 =
          t < reach
            ? transport.wrist(t)
            : { ...grasp.point, y: grasp.point.y + up };
        return {
          ...held,
          joints: {
            ...held.joints,
            ...HumanPrehension.shape(shapes, peak, t / reach),
          },
          limbs: {
            ...held.limbs,
            [limb]: {
              point: wrist,
              rotation: t < reach ? transport.turn(t) : grasp.rotation,
              bend,
              // The grip's own arm solution anchors the hold and the lift,
              // and the reach more and more as it arrives, so the two meet
              // exactly.
              ...(t >= reach
                ? { planted: true, reference: chosen.reference }
                : {
                    reference: {
                      ...chosen.reference,
                      weight: minimumJerk(t / reach).s,
                    },
                  }),
            },
          },
        };
      },
    };
  }

  /**
   * Refuse a wrist goal beyond the straight arm's reach from its shoulder in
   * the posture the action is entered from.
   *
   * @param context The action's context.
   * @param side The arm.
   * @param wrist The wrist goal, world metres.
   * @throws {Error} When the goal is farther than the upper arm and forearm together.
   */
  export function reachable(
    context: IHumanActionContext<object>,
    side: HumanHand.Side,
    wrist: IAutoMovieVector3,
  ): void {
    const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(
      context.body,
      context.entry.posture,
    ).get(`${side}UpperArm`)!.worldPosition;
    const distance: number = Vector3.length(Vector3.subtract(wrist, shoulder));
    const limit: number =
      context.body.measure.upperArm + context.body.measure.forearm;
    if (distance > limit + 1e-6)
      throw new Error(
        `${context.subject}: the grip lies ${distance.toFixed(3)} m from the ${side} shoulder, beyond the arm's ${limit.toFixed(3)} m; bend or step closer first`,
      );
  }
}
