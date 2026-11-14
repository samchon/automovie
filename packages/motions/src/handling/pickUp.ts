import {
  type IAutoMovieResolvedBone,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandAttitude } from "../posture/HumanHandAttitude";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGraspUse } from "./HumanGraspUse";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { HumanPreshape } from "./HumanPreshape";
import { pickUpAdjust } from "./pickUpAdjust";
import { pickUpPosture } from "./pickUpPosture";
import { pickUpSearch } from "./pickUpSearch";

/**
 * Reaching for a prop's grip, grasping it and lifting it clear.
 *
 * The goal is the grip, not the arm: the hand's grip socket is brought onto
 * the prop's grip affordance along its approach axis (`HumanGrasp`), taken
 * as the archetype declares it: untilted, and from the side about the
 * grip's axis the arm reaches with the least wrist error among the sides
 * its declared symmetry allows (any side of a round grip, either of a
 * half-symmetric one, the declared one otherwise; `pickUpSearch.TURNS`);
 * a use's grasp is searched over its own turns and tilts. Then the
 * fingers open to the peak aperture on the way and close on the prop's
 * colliders until contact (`HumanGrip`), and inverse kinematics solves the
 * arm. Where the arm reaches the grip from the posture the action is
 * entered in, the rest of the body holds that posture, so a pick up
 * continues a stand or the deepest point of a bend with its feet planted,
 * and only the reaching arm and its fingers move. Where it does not, a
 * standing body is lowered toward the grip over the reach, as the bend law
 * lowers it (`pickUpPosture`): a slight lean at a counter, a stoop or a
 * squat for a low one, the feet planted; a seated one leans from its seat;
 * and where the arm still misses, the trunk turns toward the grip first
 * (`pickUpAdjust.turned`);
 * it holds there through the load
 * and the lift and straightens over as long again, the hand riding with the
 * shoulder, and the event `upright` closes the action.
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
 * Events: `gripClosed`, `liftOff`, `lifted`, and `upright` after a lowered
 * body straightens. A pick up cut into a stand before `gripClosed` abandons
 * the reach; after `lifted` it continues into a stand, a walk, a put down or
 * a hand over. A grip no lowering brings within the arm, or one beyond the
 * arm of a body that is not standing, is refused with the step named.
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

    /**
     * What the prop is taken up for, when it is a tool: the grasp is then
     * chosen for the use and not only for the reach. A handle can be wrapped
     * from any side, and the side the hanging arm reaches most easily leaves
     * a blade or a barrel where the wrist cannot later aim it. With a use,
     * the grasp must also hold with the tool presented ahead of the shoulder
     * on the line the use names, and a handle no grasp serves so is refused.
     * Absent, the grasp is chosen for the reach and the lift alone.
     */
    use?: HumanGraspUse.IUse;
  }

  /** The share of the reach over which the arm leaves its entry pose by a blend of its joints, before the transport's goal alone leads it to the grip (provisional: 0.6, ahead of the last stretch the hand makes along the approach). */
  export const LEAVE: number = 0.6;

  /** The load phase between contact and lift-off, seconds; provisional. */
  export const LOAD: number = 0.15;

  /**
   * Plan a pick up.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When no lowering brings the grip within the arm's reach (step closer first), or no grasp serves the use.
   * @throws {Error} When the lift is negative, or the prop has no such affordance or no colliders.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const side: HumanHand.Side = context.params.hand ?? "right";
    const lift: number = context.params.lift ?? 0.1;
    if (!(lift >= 0)) throw new Error("A pick up lifts a non-negative height");
    const body: IHumanBody = context.body;

    // The grasp: where the hand goes, how it opens and how it closes.
    // The grip is taken from the side of its axis the arm can reach with the
    // hand turned as asked (a cylinder grips alike from any azimuth).
    const authored: HumanGrasp.ITarget = HumanGrasp.target(
      context,
      context.params.prop,
      context.params.handle,
      context.start,
    );

    // The grasp chosen from the entry's body; where its arm does not reach,
    // from the body lowered toward the grip (`pickUpPosture`).
    let found: pickUpSearch.ISearched = pickUpSearch.of(
      context,
      side,
      lift,
      authored,
      {
        posture: context.entry.posture,
        at: (): IHumanPosture => context.entry.posture,
        lower: (posture: IHumanPosture): IHumanPosture => posture,
      },
    );
    // A standing body no stoop or squat brings to the grip may still turn
    // or step toward it, below; anything else the lowering refuses stands.
    const standing: boolean = context.entry.base.kind === "standing";
    let lowered: pickUpPosture.IStance | null = null;
    if (!pickUpPosture.reaches(context, side)(found.chosen.wrist))
      try {
        lowered = pickUpPosture.lowered(context, side, authored.point);
      } catch (error) {
        if (!(standing && error instanceof HumanRefusal)) throw error;
      }
    if (lowered !== null)
      found = pickUpSearch.of(context, side, lift, authored, lowered);

    // Still out of reach, the trunk turns toward the grip first.
    if (
      !pickUpPosture.reaches(
        context,
        side,
        found.stance.posture,
      )(found.chosen.wrist)
    ) {
      lowered = pickUpAdjust.turned(
        context,
        side,
        found.chosen.wrist.point,
        found.stance,
      );
      found = pickUpSearch.of(context, side, lift, authored, lowered);
    }
    // Still out of reach, one foot takes one adjustment step toward it.
    if (
      standing &&
      !pickUpPosture.reaches(
        context,
        side,
        found.stance.posture,
      )(found.chosen.wrist)
    ) {
      const stepped: pickUpPosture.IStance | null = pickUpAdjust.stepped(
        context,
        side,
        found.chosen.wrist.point,
        found.stance,
      );
      if (stepped !== null) {
        lowered = stepped;
        found = pickUpSearch.of(context, side, lift, authored, stepped);
      }
    }
    const { chosen, bend, stance }: pickUpSearch.ISearched = found;
    const held: IHumanPosture = stance.posture;
    const target: HumanGrasp.ITarget = HumanGrasp.around(authored, chosen.turn);
    const grasp: HumanHand.IWrist = chosen.wrist;
    pickUpPosture.reachable(context, side, grasp.point, held);

    // The use is judged at its own pose. What the grasp pose leaves unmet of
    // an asked tilt is no failure of the use: the fingers close where the
    // arm shows the hand, and the use's pose is built from that hand.
    const unmet: number = chosen.keys[chosen.keys.length - 1] ?? chosen.miss;
    if (context.params.use !== undefined && unmet > HumanGraspUse.UNMET)
      throw new HumanRefusal({
        kind: "reach",
        axis: "use",
        value: unmet,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: HumanGraspUse.UNMET,
          unit: "",
        },
        reason: `no grasp of ${context.params.prop} by ${context.params.handle} lets the ${side} hand present its ${context.params.use.tip} on the ${context.params.use.line} line: the best (turned ${chosen.turn}, tilted ${chosen.tilt} degrees, the elbow ${chosen.departure.toFixed(0)} degrees off its hint) leaves ${unmet.toFixed(1)} degrees and millimetres unmet at the use's pose (by pose in the order grasp, lift, use: ${chosen.keys.map((miss: number): string => miss.toFixed(1)).join(", ")})`,
        fix: "turn the prop where it lies so the handle can be taken from the side its use needs, take it with the other hand, or name another line for the use",
      });

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
    // A lowered body comes down over the reach and straightens over as long
    // after the lift, as a bend descends and rises in one time.
    const end: number = reach + LOAD + rise;
    const up: number = lowered === null ? 0 : reach;
    const duration: number = end + up;
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
    const rest: AutoMovieMotionHumanArm.IAngles =
      AutoMovieMotionHumanArm.angles(context.entry.pose, side);
    const hand: IHumanContactWindow["part"] =
      side === "left" ? "leftHand" : "rightHand";
    const shoulder = (posture: IHumanPosture): IAutoMovieVector3 =>
      HumanTrunk.resolve(body, posture).get(`${side}UpperArm`)!.worldPosition;
    const bottom: IAutoMovieVector3 | null =
      lowered === null ? null : shoulder(held);
    return {
      duration,
      events: [
        { name: "gripClosed", share: reach / duration },
        { name: "liftOff", share: (reach + LOAD) / duration },
        { name: "lifted", share: end / duration },
        ...(lowered === null ? [] : [{ name: "upright", share: 1 }]),
      ],
      contacts: [
        ...pickUpAdjust.plants(lowered, reach, end, up),
        // What else the body rests on at the entry, a seat or a back, it
        // keeps throughout.
        ...context.entry.supports
          .filter(
            (s: IHumanEntryState.ISupport): boolean =>
              s.part !== "leftFoot" && s.part !== "rightFoot",
          )
          .map(
            (s: IHumanEntryState.ISupport): IHumanContactWindow => ({
              ...s,
              from: 0,
              to: 1,
            }),
          ),
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

        // The body at the second: the entry, lowered over the reach and
        // straightened after the lift when the arm reaches only lowered.
        const base: IHumanPosture =
          lowered === null || (t >= reach && t <= end)
            ? held
            : lowered.at(
                t < reach
                  ? minimumJerk(t / reach).s
                  : 1 - minimumJerk((t - end) / up).s,
              );
        // As the body straightens the hand rides with the shoulder.
        const raised: IAutoMovieVector3 =
          t > end
            ? Vector3.subtract(shoulder(base), bottom!)
            : { x: 0, y: 0, z: 0 };

        // The posture whose arm goal is the transport's at a second of the
        // action, with the fingers shaped as they are at `shaped`.
        const goaled = (at: number, shaped: number): IHumanPosture => ({
          ...base,
          joints: {
            ...base.joints,
            ...HumanPrehension.shape(shapes, peak, shaped / reach),
          },
          limbs: {
            ...base.limbs,
            [limb]: {
              point:
                at < reach
                  ? transport.wrist(at)
                  : Vector3.add(raised, {
                      ...grasp.point,
                      y:
                        grasp.point.y +
                        (rise > 0
                          ? lift *
                            minimumJerk(Math.min(1, (at - reach - LOAD) / rise))
                              .s
                          : 0),
                    }),
              rotation: at < reach ? transport.turn(at) : chosen.shown.rotation,
              bend,

              // The grip's own arm solution anchors the whole action, at one
              // constant weight: a weight that grew through the reach let the
              // fit change from one of its solutions to another at a single
              // instant, which showed as a step of the elbow.
              reference: chosen.reference,
              ...(at >= reach ? { planted: true } : {}),
            },
          },
        });

        // The arm leaves the pose it was entered in by a blend of its joints
        // toward one fixed pose, the transport's at the end of this first
        // part, so the elbow keeps one course from the hanging arm: a goal
        // solved afresh at each second near the hip, far from the grip's
        // solution, changed solution between seconds (the wrist read 0.4 m
        // apart 1/120 s apart). From there the transport's goal alone leads
        // to the grip. The blend eases in and arrives moving.
        const leave: number = LEAVE * reach;
        // Gripped, the hand keeps the rotation it showed as the fingers
        // closed, solved at the wrist (`HumanHandAttitude`), so what it holds
        // keeps the attitude it was taken in: a glass is lifted upright.
        if (t >= reach)
          return HumanHandAttitude.held(
            body,
            goaled(t, t),
            side,
            chosen.shown.rotation,
          );
        return t >= leave
          ? goaled(t, t)
          : AutoMovieMotionHumanArm.carry(
              body,
              goaled(leave, t),
              { [side]: rest },
              (t / leave) ** 2,
            );
      },
    };
  }

  /** Whether a wrist goal lies within the straight arm's reach from its shoulder (`pickUpPosture.reaches`), which the put down reads too. */
  export const reaches: typeof pickUpPosture.reaches = pickUpPosture.reaches;

  /** Refuse a wrist goal beyond the straight arm's reach from its shoulder (`pickUpPosture.reachable`), which the put down reads too. */
  export const reachable: typeof pickUpPosture.reachable =
    pickUpPosture.reachable;
}
