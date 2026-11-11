import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { hipJoints } from "../posture/hipJoints";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";

/**
 * A crouch or a squat held in place: the hips sink over the planted feet to
 * a knee flexion the depth names, the trunk inclines until the centre of
 * mass is back over the feet, the hands come to rest on the thighs above the
 * knees, the body holds, then stands again.
 *
 * The depth is a knee flexion, not a height, so one depth fits every body:
 * `partial` is the parallel squat of about 100 degrees (Escamilla 2001, Med
 * Sci Sports Exerc 33:127) and `full` the deep squat at the knee's range end
 * of 150 degrees, inside the 141.6 degrees measured in kneeling (Acker et al.
 * 2011, J Arthroplasty 26:319) and below the 157 +- 6 degrees of a heels-up
 * squat (Hemmerich et al. 2006, J Orthop Res 24:770), which the range table
 * does not reach. The shank tilts forward by the ankle's dorsiflexion range,
 * plus the heel lift when the heels are up (the foot pivots about its toes'
 * joint, which stays on the floor), and the thigh takes the rest of the knee
 * flexion, so the hip joint's place over the ankle follows from the leg's
 * two lengths. A depth whose thigh angle and the hip's flexion range leave
 * no room for the trunk is refused with the deepest knee flexion the heels
 * allow: a full squat with flat heels needs more ankle dorsiflexion than the
 * range table's 20 degrees, so it asks for `heels: "up"` (Hemmerich et al.
 * 2006 measure heels-flat squats only on bodies with that ankle range).
 *
 * The trunk's forward pitch about the hips is found by bisection so that the
 * whole-body centre of mass lies over the middle of the soles
 * (`HumanBalance.offset`), capped by the hip's flexion range; the hands rest
 * on the thighs just above the knees, as people support the trunk on the
 * thighs (Kingma, Faber and van Dieen 2016, J Biomech 49:881). The descent
 * takes 1.0 s for a partial and 1.3 s for a full squat at a 0.93 m hip
 * height, scaled by the square root of the hip height (dynamic similarity,
 * Alexander 1984) and by the manner's tempo (provisional), the hold `hold`
 * seconds and the rise as long as the descent. Events: `descend` at the
 * start, `lowest`, `ascend`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the depth law with its sources, the refusal, the balance solve, the hands, the timing and the events, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core composed of part primitives over a standing base on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the depth table and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is read from the body's measure and the range table; no world coordinate is typed.
 */
export namespace crouch {
  /** The action's name. */
  export const name: HumanActionName = "crouch";

  /** Cancel table: a crouch stands up at any time, and kneels or handles a low thing from its lowest pose. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    crouch: [{ window: ["ascend", 1], kind: "inertialize", entry: 0 }],
    kneel: [
      {
        window: ["lowest", "ascend"],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
    pickUp: [
      {
        window: ["lowest", "ascend"],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
    putDown: [
      {
        window: ["lowest", "ascend"],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
  };

  /** How deep: a parallel squat or a deep squat. */
  export type Depth = "partial" | "full";

  /** Whether the heels stay on the floor or rise about the toes' joints. */
  export type Heels = "flat" | "up";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and its default.
   * @evidence contracts/development/design.md#principled-representation Two closed names and a hold; the knee flexion and the heel lift come from tables.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four optional members, all read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No height or angle is typed by the author.
   */
  export interface IParams {
    /** How deep; `partial` when absent. */
    depth?: Depth;

    /** The heels; `flat` for a partial and `up` for a full squat when absent. */
    heels?: Heels;

    /** Seconds held at the lowest pose; 1 when absent. */
    hold?: number;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** Knee flexion at the lowest pose by depth, degrees (Escamilla 2001; the range table's end for `full`). */
  export const KNEE: Readonly<Record<Depth, number>> = {
    partial: 100,
    full: 150,
  };

  /** The heel lift of `heels: "up"`, degrees about the toes' joint (provisional, the bend law's squat lift). */
  export const HEEL: number = 30;

  /** Descent seconds by depth for a 0.93 m hip height (provisional). */
  export const DESCENT: Readonly<Record<Depth, number>> = {
    partial: 1.0,
    full: 1.3,
  };

  /**
   * Plan a crouch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the hold is negative, or the depth leaves the hip's flexion range no room with the heels asked for.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the plan and both refusals; the namespace gives the law.
   * @evidence contracts/development/implementation.md#principled-implementation The hip's place follows from the knee flexion and the shank's tilt by the leg's two lengths, the pitch from a bisection on the centre of mass over the soles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock, a standing base, one body row and two arm rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An infeasible depth throws with the feasible knee flexion instead of being clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms The pitch is solved once per plan in 24 bisection steps; each posture costs one lowering and one arm solve per side.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The hip shift and the pitch are computed once and every posture scales them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its solved numbers and the base.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const depth: Depth = context.params.depth ?? "partial";
    const heels: Heels =
      context.params.heels ?? (depth === "full" ? "up" : "flat");
    const hold: number = context.params.hold ?? 1;
    if (!(hold >= 0)) throw new Error("A crouch's hold is not negative");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);

    // The leg's angles: the shank tilts by the ankle's range plus the heel
    // lift, the thigh takes the rest of the knee flexion.
    const dorsiflexion: number =
      AutoMovieMotionHumanRange.limit("leftFoot", "flexion") ?? 0;
    const hipRange: number =
      AutoMovieMotionHumanRange.limit("leftUpperLeg", "flexion") ?? 0;
    const heel: number = heels === "up" ? HEEL : 0;
    const shankTilt: number = dorsiflexion + heel;
    const knee: number = KNEE[depth];
    const thighTilt: number = knee - shankTilt;
    if (thighTilt >= hipRange)
      throw new Error(
        `${context.subject}: a ${depth} crouch with the heels ${heels} needs ${thighTilt.toFixed(0)} degrees of hip flexion before the trunk inclines, past the ${hipRange} degree range; the deepest knee flexion with these heels is ${(hipRange - 5 + shankTilt).toFixed(0)} degrees${heels === "flat" ? ", or raise the heels" : ""}`,
      );

    // The clock: descent, hold, rise.
    const down: number = DESCENT[depth] * Math.sqrt(m.hipHeight / 0.93);
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.sequence([
        { name: "descend", seconds: down },
        { name: "lowest", seconds: hold },
        { name: "ascend", seconds: down },
      ]),
      modifiers,
      { holds: ["lowest"] },
    );
    const duration: number = clock.duration;
    const base: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
    });
    const standing: IHumanPosture = base.posture(0);
    const yaw: number = standing.yaw;
    const share = (seconds: number): number =>
      clock.envelope(["descend", "lowest"], ["ascend", "end"], seconds);

    // The feet at a share of the heel lift: each pivots about its toes' joint.
    const feet = (
      posture: IHumanPosture,
      s: number,
    ): IHumanPosture["limbs"] => {
      const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
      for (const side of ["left", "right"] as const) {
        const goal: IHumanPosture.IGoal = posture.limbs[`${side}Leg`]!;
        const flat: HumanFoot.IPlacement = {
          ankle: goal.point,
          rotation: goal.rotation ?? HumanFrame.turn(yaw),
        };
        const placed: HumanFoot.IPlacement =
          heel === 0
            ? flat
            : HumanFoot.pivot(
                body,
                side,
                "mtp",
                HumanFoot.point(body, side, "mtp", flat),
                HumanFoot.heading(flat.rotation),
                -heel * s,
              );
        limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
          body,
          posture,
          side,
          placed,
          true,
        );
      }
      return limbs;
    };

    // The hip joints' move at the lowest pose, from the leg's geometry over
    // each lifted ankle, averaged over the two legs.
    const lowLimbs: IHumanPosture["limbs"] = feet(standing, 1);
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const rad = (deg: number): number => (deg * Math.PI) / 180;
    const joints = hipJoints(body, standing.root, HumanFrame.turn(yaw));
    let move: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const side of ["left", "right"] as const) {
      const ankle: IAutoMovieVector3 = lowLimbs[`${side}Leg`]!.point;
      const hip: IAutoMovieVector3 = Vector3.add(
        Vector3.add(ankle, {
          x: 0,
          y:
            m.shank * Math.cos(rad(shankTilt)) +
            m.thigh * Math.cos(rad(thighTilt)),
          z: 0,
        }),
        Vector3.scale(
          forward,
          m.shank * Math.sin(rad(shankTilt)) -
            m.thigh * Math.sin(rad(thighTilt)),
        ),
      );
      move = Vector3.add(
        move,
        Vector3.scale(Vector3.subtract(hip, joints[side]), 0.5),
      );
    }

    // The body at a share: root moved, trunk pitched about the hips, feet lifted.
    const lowered = (
      posture: IHumanPosture,
      s: number,
      pitch: number,
    ): IHumanPosture => {
      const moved: IHumanPosture = {
        ...posture,
        root: Vector3.add(posture.root, Vector3.scale(move, s)),
      };
      const tipped: IHumanPosture = AutoMovieMotionHumanLean.tip(
        body,
        moved,
        pitch * s,
        0,
      );
      return resolveHumanPosture.lower(body, {
        ...tipped,
        joints: {
          ...tipped.joints,
          ...(heel === 0
            ? {}
            : {
                leftToes: [heel * s, 0, 0] as const,
                rightToes: [heel * s, 0, 0] as const,
              }),
        },
        limbs: feet(tipped, s),
      });
    };

    // The pitch that brings the centre of mass over the soles, within the
    // hip's remaining flexion range.
    const most: number = hipRange - thighTilt - 5;
    const error = (q: number): number =>
      HumanBalance.offset(body, lowered(standing, 1, q));
    let pitch: number = 0;
    if (error(0) < 0) {
      if (error(most) <= 0) pitch = most;
      else {
        let lo: number = 0;
        let hi: number = most;
        for (let i: number = 0; i < 24; i++) {
          const mid: number = (lo + hi) / 2;
          if (error(mid) < 0) lo = mid;
          else hi = mid;
        }
        pitch = (lo + hi) / 2;
      }
    }

    const sink: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture =>
        lowered(posture, share(seconds), pitch),
    };
    const rest = (side: "left" | "right"): IAutoMovieMotionHumanPrimitive =>
      brace(
        body,
        side,
        AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        duration,
        share,
      );

    return composeAutoMovieMotionHumanAction({
      base,
      clock,
      contact: "lowest",
      primitives: [sink, rest("left"), rest("right")],
    });
  }

  /**
   * A palm carried from the angles the arm held onto its own thigh just
   * above the knee, the hand support of a low posture (Kingma, Faber and van
   * Dieen 2016, J Biomech 49:881), read on the legs the action has placed.
   *
   * @param body The body.
   * @param side The hand and thigh.
   * @param rest The arm's angles at weight 0.
   * @param duration The action's duration, seconds; the arm is written over all of it.
   * @param weight How far the palm is on the thigh at a second, in [0, 1].
   * @returns The primitive, on the arm's channel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the place, its source, the frame it rides and the weight.
   * @evidence contracts/development/implementation.md#principled-implementation The thigh's front region is placed on the solved thigh and moved 0.6 of the way toward the knee; the palm faces it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One arm carry with one goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 0.6 share toward the knee is provisional, the bend law's brace point.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per written second for the thigh.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the crouch and the kneel.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Closes over its arguments only.
   */
  export function brace(
    body: IHumanBody,
    side: "left" | "right",
    rest: AutoMovieMotionHumanArm.IAngles,
    duration: number,
    weight: (seconds: number) => number,
  ): IAutoMovieMotionHumanPrimitive {
    return AutoMovieMotionHumanArm.carried({
      body,
      side,
      from: 0,
      to: duration,
      rest,
      weight,
      goal: (posture: IHumanPosture): IHumanPosture.IGoal => {
        const bones = poseBones(body, resolveHumanPosture(body, posture));
        const thigh = bones.get(`${side}UpperLeg`)!;
        const kneeAt: IAutoMovieVector3 = bones.get(
          `${side}LowerLeg`,
        )!.worldPosition;
        const region =
          body.surfaces.regions[
            side === "left" ? "thighFrontLeft" : "thighFrontRight"
          ];
        const onThigh: IAutoMovieVector3 = Vector3.add(
          thigh.worldPosition,
          Quaternion.rotateVector(thigh.worldRotation, region.point),
        );
        const point: IAutoMovieVector3 = Vector3.lerp(
          onThigh,
          Vector3.add(
            kneeAt,
            Vector3.subtract(
              onThigh,
              Vector3.lerp(thigh.worldPosition, kneeAt, 0.5),
            ),
          ),
          0.6,
        );
        return AutoMovieMotionHumanArm.goal(
          body,
          side,
          AutoMovieMotionHumanTarget.hand(
            body,
            posture,
            side,
            {
              point,
              normal: Quaternion.rotateVector(
                thigh.worldRotation,
                region.normal,
              ),
            },
            {
              surface: "palm",
              shape: "relaxed",
              forward: Vector3.subtract(kneeAt, thigh.worldPosition),
            },
          ),
        );
      },
    });
  }
}
