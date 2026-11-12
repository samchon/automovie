import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { kneelKeys } from "../everyday/kneelKeys";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { hipJoints } from "../posture/hipJoints";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Crawling on hands and knees along the heading, from standing: the body
 * gets down onto hands and knees, then crawls a number of cycles in the
 * diagonal pattern, each hand moving with the opposite knee like a
 * quadruped's trot (Patrick, Noah and Yang 2009, J Neurophysiol 101:603).
 *
 * The goals are floor points. The knees rest a shank's radius over the
 * floor under the hip joints with the thighs upright, the shins lying back
 * to feet tucked on their toes (`kneelKeys.tucked`); the palms rest flat
 * with each wrist under its shoulder and the arm at `ARM` of its length, so
 * the trunk's pitch is the one that puts the posed shoulders at that height.
 * The pelvis travels at a constant speed of one stride a cycle, as high as
 * each thigh reaches its knee from it; each limb is planted on a floor
 * point for `DUTY` of the cycle, centred on its own share, and swings to the
 * next one a stride ahead on an arc, a hand `LIFT` high and a knee
 * `KNEE_LIFT`, the left hand and the right knee half a cycle apart from the
 * right hand and the left knee. Each hip joint rides a thigh over its own
 * knee, so a swinging knee is lifted by the pelvis turning about the spine's
 * axis (the hip hike of a quadruped's swing), which the spine and the chest
 * turn back so the shoulders stay level over the hands. Getting
 * down blends from standing to the first footprints over `DOWN` seconds.
 * The cycle, the stride, the duty and the lift are provisional, scaled by
 * the square root of the hip height and the manner's tempo. Events: `down`
 * (on hands and knees), and per limb and cycle `<limb>Liftoff<n>` and
 * `<limb>Touchdown<n>`, the limb one of `leftHand`, `rightHand`, `leftKnee`,
 * `rightKnee`.
 *
 * Not yet: hands-and-feet crawling (MacLellan et al. 2012), the belly crawl,
 * turning, rising from the crawl, and knee contact windows (the contact
 * parts have no knee).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the posture law, the gait with its source, the timing, the events and what is missing, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of one whole-body row over a limb schedule on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the constants and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place follows from the body's measure.
 */
export namespace crawl {
  /** The action's name. */
  export const name: HumanActionName = "crawl";

  /** Cancel table: none yet; a crawl ends on hands and knees. */
  export const interrupts: IHumanActionLaw["interrupts"] = {};

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation A cycle count and a manner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No distance is typed.
   */
  export interface IParams {
    /** How many crawl cycles; 3 when absent. */
    cycles?: number;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** A limb of the crawl. */
  export type Limb = "leftHand" | "rightHand" | "leftKnee" | "rightKnee";

  /** Each limb's swing start as a share of the cycle: diagonal pairs together. */
  export const PHASES: Readonly<Record<Limb, number>> = {
    leftHand: 0,
    rightKnee: 0,
    rightHand: 0.5,
    leftKnee: 0.5,
  };

  /** One cycle's seconds at a 0.93 m hip height (provisional). */
  export const CYCLE: number = 1.2;

  /** The stride as a share of the thigh (provisional). */
  export const STRIDE: number = 0.6;

  /** The share of a cycle a limb is planted (provisional). */
  export const DUTY: number = 0.6;

  /** A swinging hand's rise, metres (provisional). */
  export const LIFT: number = 0.04;

  /** A swinging knee's rise, metres (provisional): the pelvis hikes it, so it clears the floor by less than a hand. */
  export const KNEE_LIFT: number = 0.02;

  /** The chest's share of the turn that levels the shoulders over a hiked pelvis; the lumbar spine takes the rest (as `AutoMovieMotionHumanTrunk.CHEST`). */
  export const CHEST: number = 0.6;

  /** The shoulder's height over the wrist as a share of the upper arm and the forearm: an elbow just short of straight (provisional). */
  export const ARM: number = 0.98;

  /** Seconds to get down onto hands and knees (provisional). */
  export const DOWN: number = 1.5;

  /**
   * Plan a crawl.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the cycle count is not a positive integer.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const cycles: number = context.params.cycles ?? 3;
    if (!(Number.isInteger(cycles) && cycles > 0))
      throw new Error("A crawl lasts a positive whole number of cycles");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const standing: IHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const yaw: number = standing.yaw;
    const frame: HumanFrame.IFrame = {
      origin: { ...standing.root, y: 0 },
      yaw,
    };
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );

    // Each wrist over its flat palm on the floor, floor frame from the palm.
    const sides = ["left", "right"] as const;
    const wrist = (side: "left" | "right"): IAutoMovieVector3 =>
      HumanFrame.local(
        { origin: { x: 0, y: 0, z: 0 }, yaw },
        AutoMovieMotionHumanArm.goal(
          body,
          side,
          AutoMovieMotionHumanTarget.hand(
            body,
            standing,
            side,
            { point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
            { surface: "palm", shape: "flat", forward },
          ),
        ).point,
      );
    const wrists = { left: wrist("left"), right: wrist("right") };

    // The body tilted by a pitch at a share of the way down, and the root
    // that puts its hip joints' middle at a place.
    const posed = (
      share: number,
      degrees: number,
      hike: number = 0,
    ): IHumanPosture => ({
      root: { x: 0, y: 0, z: 0 },
      yaw,
      pitch: degrees * share,
      roll: 0,
      joints: {
        ...stand.RELAXED,
        neck: [-40 * share, 0, 0],
        hips: [0, 0, hike],
        spine: [0, 0, -(1 - CHEST) * hike],
        chest: [0, 0, -CHEST * hike],
      },
      limbs: {},
    });
    const rootFor = (
      tilted: IHumanPosture,
      hips: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
      const joints = hipJoints(
        body,
        { x: 0, y: 0, z: 0 },
        resolveHumanPosture.heading(tilted),
        tilted.joints.hips,
      );
      return Vector3.subtract(
        hips,
        Vector3.lerp(joints.left, joints.right, 0.5),
      );
    };

    // The trunk's pitch: the one that puts the posed shoulders an arm at
    // `ARM` of its length over the wrists, the hip joints a thigh over the
    // knees.
    const knee: number = m.shankRadius;
    const hipY: number = knee + m.thigh;
    const shoulderY: number =
      (wrists.left.y + wrists.right.y) / 2 + ARM * (m.upperArm + m.forearm);
    const crawlingAt = (degrees: number) => {
      const tilted: IHumanPosture = posed(1, degrees);
      return poseBones(
        body,
        resolveHumanPosture(body, {
          ...tilted,
          root: rootFor(
            tilted,
            HumanFrame.point(frame, { x: 0, y: hipY, z: 0 }),
          ),
        }),
      );
    };
    let lo: number = 0;
    let hi: number = 120;
    for (let i: number = 0; i < 24; i++) {
      const mid: number = (lo + hi) / 2;
      const bones = crawlingAt(mid);
      if (
        (bones.get("leftUpperArm")!.worldPosition.y +
          bones.get("rightUpperArm")!.worldPosition.y) /
          2 >
        shoulderY
      )
        lo = mid;
      else hi = mid;
    }
    const pitch: number = (lo + hi) / 2;
    const bones = crawlingAt(pitch);
    const local = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      HumanFrame.local(frame, bones.get(bone)!.worldPosition);

    // Nominal limb places relative to the hips' travel, floor frame: each
    // palm where its wrist stands under the shoulder, each knee under its
    // hip joint.
    const under = (side: "left" | "right"): IAutoMovieVector3 => {
      const shoulder: IAutoMovieVector3 = local(`${side}UpperArm`);
      return {
        x: shoulder.x - wrists[side].x,
        y: 0,
        z: shoulder.z - wrists[side].z,
      };
    };
    const nominal: Record<Limb, IAutoMovieVector3> = {
      leftHand: under("left"),
      rightHand: under("right"),
      leftKnee: { ...local("leftUpperLeg"), y: knee },
      rightKnee: { ...local("rightUpperLeg"), y: knee },
    };

    // Each foot tucked on its toes behind its knee, solved once at the
    // nominal knee and carried with the knee.
    const tuck = (side: "left" | "right") => {
      const from: IHumanPosture.IGoal = standing.limbs[`${side}Leg`]!;
      const at: IAutoMovieVector3 = HumanFrame.point(
        frame,
        nominal[`${side}Knee`],
      );
      const foot: kneelKeys.IFoot = kneelKeys.tucked(
        body,
        side,
        at,
        yaw,
        HumanFoot.point(body, side, "mtp", {
          ankle: from.point,
          rotation: from.rotation ?? HumanFrame.turn(yaw),
        }).y,
      );
      return { foot, offset: Vector3.subtract(foot.at, at) };
    };
    const tucks = { left: tuck("left"), right: tuck("right") };

    // The clock: getting down, the cycles, a settle.
    const period: number =
      CYCLE * Math.sqrt(m.hipHeight / 0.93) * modifiers.tempo;
    const stride: number = STRIDE * m.thigh;
    const speed: number = stride / period;
    const swing: number = (1 - DUTY) * period;
    const limbs: Limb[] = ["leftHand", "rightHand", "leftKnee", "rightKnee"];
    const instants: AutoMovieMotionClock.IInstant[] = [
      { name: "down", seconds: DOWN },
    ];
    const lift = (limb: Limb, k: number): number =>
      DOWN + (k - 1 + PHASES[limb]) * period;
    for (const limb of limbs)
      for (let k: number = 1; k <= cycles; k++)
        instants.push(
          { name: `${limb}Liftoff${k}`, seconds: lift(limb, k) },
          { name: `${limb}Touchdown${k}`, seconds: lift(limb, k) + swing },
        );
    const duration: number = DOWN + cycles * period + 0.3;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      duration,
      instants,
    );

    // A limb's floor point: footprint j sits a stride ahead of j - 1, centred
    // on its stance.
    const print = (limb: Limb, j: number): IAutoMovieVector3 =>
      HumanFrame.point(
        frame,
        Vector3.add(nominal[limb], {
          x: 0,
          y: 0,
          z: stride * (j + PHASES[limb] - 0.3),
        }),
      );
    const place = (
      limb: Limb,
      seconds: number,
    ): { point: IAutoMovieVector3; planted: boolean } => {
      for (let k: number = 1; k <= cycles; k++) {
        const off: number = lift(limb, k);
        if (seconds < off) return { point: print(limb, k - 1), planted: true };
        if (seconds < off + swing) {
          const s: number = minimumJerk((seconds - off) / swing).s;
          const at: IAutoMovieVector3 = Vector3.lerp(
            print(limb, k - 1),
            print(limb, k),
            s,
          );
          return {
            point: {
              ...at,
              y:
                at.y +
                4 * (limb.endsWith("Hand") ? LIFT : KNEE_LIFT) * s * (1 - s),
            },
            planted: false,
          };
        }
      }
      return { point: print(limb, cycles), planted: true };
    };
    // The hips travel at a constant speed, each hip joint a thigh from its
    // knee: their middle is the pelvis's height and their difference its
    // turn about the spine's axis, positive lifting the left hip.
    const separation: number = Vector3.length(
      Vector3.subtract(local("leftUpperLeg"), local("rightUpperLeg")),
    );
    const hipsAt = (
      seconds: number,
    ): { point: IAutoMovieVector3; hike: number } => {
      const level: IAutoMovieVector3 = HumanFrame.point(frame, {
        x: 0,
        y: 0,
        z: speed * Math.min(cycles * period, Math.max(0, seconds - DOWN)),
      });
      const [left, right] = sides.map((side): number => {
        const kneeAt: IAutoMovieVector3 = place(`${side}Knee`, seconds).point;
        const along: number = Vector3.dot(
          Vector3.subtract(kneeAt, level),
          forward,
        );
        return (
          kneeAt.y +
          Math.sqrt(
            Math.max(
              0,
              m.thigh * m.thigh -
                (along - nominal[`${side}Knee`].z) *
                  (along - nominal[`${side}Knee`].z),
            ),
          )
        );
      }) as [number, number];
      const sine: number =
        (left - right) / (separation * Math.sin((pitch * Math.PI) / 180));
      return {
        point: { ...level, y: (left + right) / 2 },
        hike: (Math.asin(Math.max(-1, Math.min(1, sine))) * 180) / Math.PI,
      };
    };

    const whole: IAutoMovieMotionHumanPrimitive = {
      channels: [
        "root",
        "trunk",
        "head",
        "leftLeg",
        "rightLeg",
        "leftHand",
        "rightHand",
        "leftArm",
        "rightArm",
      ],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const w: number = clock.progress("start", "down", seconds);
        const hips = hipsAt(seconds);
        const target: IHumanPosture = posed(w, pitch, hips.hike);
        const root: IAutoMovieVector3 = Vector3.lerp(
          standing.root,
          rootFor(target, hips.point),
          w,
        );
        const out: IHumanPosture = {
          ...target,
          root,
          limbs: {},
          joints: { ...posture.joints, ...target.joints },
        };
        for (const side of sides) {
          const kneeAt = place(`${side}Knee`, seconds).point;
          const foot: kneelKeys.IFoot = tucks[side].foot;
          const placement: HumanFoot.IPlacement = HumanFoot.pivot(
            body,
            side,
            "mtp",
            Vector3.add(kneeAt, tucks[side].offset),
            foot.heading,
            foot.pitch,
          );
          const from: IHumanPosture.IGoal = standing.limbs[`${side}Leg`]!;
          out.limbs[`${side}Leg`] = {
            point: Vector3.lerp(from.point, placement.ankle, w),
            rotation: Quaternion.slerp(
              from.rotation ?? HumanFrame.turn(yaw),
              placement.rotation,
              w,
            ),
            bend: Vector3.lerp(from.bend, kneeAt, w),
          };
          out.joints[`${side}Toes`] = [foot.toes * w, 0, 0];
        }
        for (const side of sides) {
          const palm = place(`${side}Hand`, seconds).point;
          const hand: AutoMovieMotionHumanArm.ITarget =
            AutoMovieMotionHumanTarget.hand(
              body,
              out,
              side,
              { point: palm, normal: { x: 0, y: 1, z: 0 } },
              { surface: "palm", shape: "flat", forward },
            );
          const goal: IHumanPosture.IGoal = AutoMovieMotionHumanArm.goal(
            body,
            side,
            hand,
          );
          out.joints = { ...out.joints, ...HumanHand.shape(side, "flat") };
          out.limbs[`${side}Arm`] = goal;
        }
        if (w >= 1) return out;
        return AutoMovieMotionHumanArm.carry(
          body,
          out,
          {
            left: AutoMovieMotionHumanArm.angles(context.entry.pose, "left"),
            right: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
          },
          w,
        );
      },
    };

    // The hands' plant windows.
    const contacts: IHumanContactWindow[] = [];
    for (const side of ["left", "right"] as const)
      for (let k: number = 0; k <= cycles; k++) {
        const from: number = k === 0 ? DOWN : lift(`${side}Hand`, k) + swing;
        const to: number = k === cycles ? duration : lift(`${side}Hand`, k + 1);
        contacts.push({
          part: `${side}Hand`,
          kind: "plant",
          from: from / duration,
          to: to / duration,
          support: { kind: "ground" },
        });
      }

    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, standing, contacts),
      clock,
      contact: "down",
      primitives: [whole],
    });
  }
}
