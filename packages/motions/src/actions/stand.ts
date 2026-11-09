import { minimumJerk, seededSmoothNoise } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";

/**
 * Quiet standing: both feet planted where they are (or under the hips when
 * entered from the air), the pelvis settling over them, arms hanging relaxed,
 * and the body swaying slightly.
 *
 * The feet keep their entry plants so a stop never slides them; a foot that
 * was not planted lands at its rest place beside the other. The root moves
 * from its entry position to the midpoint of the feet over the first 0.5 s on
 * a minimum-jerk profile and sits 5 mm below full extension so the knees are
 * not locked. Each foot turns out 7° from the heading, the mean adult foot
 * progression angle (Perry and Burnfield, Gait Analysis, 2nd ed.). Arms hang
 * with 5° of shoulder abduction, 12° of elbow flexion and fingers curled 15°,
 * a relaxed hand's resting cascade. Postural sway moves the root on two
 * seeded smooth signals below 1 Hz with an RMS of 3 mm for an elite and 4.8
 * mm for a novice: quiet-stance centre-of-pressure sway of healthy adults is a
 * few millimetres RMS (Prieto et al. 1996), and experts sway less (Perrin et
 * al. 2002, provisional factor 1.6). The window of the noise keeps the start
 * and the end of the stand exact.
 */
export namespace stand {
  /** The action's name. */
  export const name: HumanActionName = "stand";

  /** Cancel table: a stand can be cut anywhere into another stand. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /**
   * Plan a stand.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const duration: number = context.params.seconds ?? 1.5;
    if (!(duration > 0)) throw new Error("A stand lasts a positive time");
    const yaw: number = context.entry.posture.yaw;
    const footing: Record<"left" | "right", IAutoMovieVector3> = feet(context.body, context.entry, yaw);
    const middle: IAutoMovieVector3 = {
      x: (footing.left.x + footing.right.x) / 2 - centre(context.body, yaw).x,
      y: -0.005,
      z: (footing.left.z + footing.right.z) / 2 - centre(context.body, yaw).z,
    };
    const settle: number = Math.min(0.5, duration);
    const from: IAutoMovieVector3 = context.entry.posture.root;
    const sway: number = 0.003 * HumanSkill.sway(context.skill);
    const sx = context.random("swayX");
    const sz = context.random("swayZ");
    return {
      duration,
      events: [{ name: "settled", share: settle / duration }],
      contacts: (["leftFoot", "rightFoot"] as const).map((part) => ({ part, kind: "plant" as const, from: 0, to: 1, support: { kind: "ground" as const } })),
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const s: number = minimumJerk(t / settle).s;
        const u: number = t / duration;
        const root: IAutoMovieVector3 = {
          x: from.x + (middle.x - from.x) * s + sway * Math.SQRT2 * seededSmoothNoise(sx, u, duration, 0.8),
          y: from.y + (middle.y - from.y) * s,
          z: from.z + (middle.z - from.z) * s + sway * Math.SQRT2 * seededSmoothNoise(sz, u, duration, 0.8),
        };
        return {
          root,
          yaw,
          pitch: 0,
          roll: 0,
          joints: RELAXED,
          limbs: legs(context.body, root, yaw, footing),
        };
      },
    };
  }

  /** Parameters. */
  export interface IParams {
    /** How long to stand, seconds; 1.5 when absent. */
    seconds?: number;
  }

  /** Foot progression angle, degrees outward from the heading (Perry and Burnfield). */
  export const TOE_OUT: number = 7;

  /** Relaxed hanging arms and a neutral trunk, clinical degrees. */
  export const RELAXED: Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> = (() => {
    const out: Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> = {};
    for (const side of ["left", "right"]) {
      out[`${side}UpperArm` as AutoMovieHumanoidBone] = [0, 5, 0];
      out[`${side}LowerArm` as AutoMovieHumanoidBone] = [12, 0, 0];
      for (const digit of ["Index", "Middle", "Ring", "Little"])
        for (const k of ["Proximal", "Intermediate", "Distal"])
          out[`${side}${digit}${k}` as AutoMovieHumanoidBone] = [15, 0, 0];
    }
    return out;
  })();

  /**
   * Where the feet stand: each planted entry foot where it is, any other at
   * its rest place in the body's frame around the entry root.
   *
   * @param body The body.
   * @param entry The entry state.
   * @param yaw The heading, degrees.
   * @returns Ankle points, world metres.
   */
  export function feet(body: IHumanBody, entry: IHumanEntryState, yaw: number): Record<"left" | "right", IAutoMovieVector3> {
    const frame: HumanFrame.IFrame = { origin: { ...entry.posture.root, y: 0 }, yaw };
    const out = {} as Record<"left" | "right", IAutoMovieVector3>;
    for (const side of ["left", "right"] as const) {
      const foot: IHumanEntryState.IFoot = entry.feet[side];
      const rest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
      out[side] = foot.planted ? { ...foot.ankle, y: body.measure.ankleHeight } : HumanFrame.point(frame, { x: rest.x, y: body.measure.ankleHeight, z: rest.z });
    }
    return out;
  }

  /**
   * Planted leg goals on given ankle points, knees bending forward.
   *
   * @param body The body.
   * @param root The root, world metres.
   * @param yaw The heading, degrees.
   * @param feet Ankle points, world metres.
   * @returns The leg goals.
   */
  export function legs(
    body: IHumanBody,
    root: IAutoMovieVector3,
    yaw: number,
    feet: Record<"left" | "right", IAutoMovieVector3>,
  ): IHumanPosture["limbs"] {
    const frame: HumanFrame.IFrame = { origin: root, yaw };
    const knee = (side: "left" | "right"): IAutoMovieVector3 => {
      const rest: IAutoMovieVector3 = body.rest.get(`${side}LowerLeg`)!;
      return HumanFrame.point(frame, { x: rest.x, y: rest.y, z: rest.z + 1 });
    };
    return {
      leftLeg: { point: feet.left, bend: knee("left"), rotation: HumanFrame.turn(yaw + TOE_OUT), planted: true },
      rightLeg: { point: feet.right, bend: knee("right"), rotation: HumanFrame.turn(yaw - TOE_OUT), planted: true },
    };
  }

  /**
   * The standing posture of a body at a floor point and heading, the state
   * every performer starts from.
   *
   * @param body The body.
   * @param at The floor point under the body, world metres.
   * @param yaw The heading, degrees.
   * @returns The posture.
   */
  export function posture(body: IHumanBody, at: IAutoMovieVector3, yaw: number): IHumanPosture {
    const frame: HumanFrame.IFrame = { origin: at, yaw };
    const feet = {} as Record<"left" | "right", IAutoMovieVector3>;
    for (const side of ["left", "right"] as const) {
      const rest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
      feet[side] = HumanFrame.point(frame, { x: rest.x, y: body.measure.ankleHeight, z: rest.z });
    }
    const root: IAutoMovieVector3 = { x: at.x, y: at.y - 0.005, z: at.z };
    return { root, yaw, pitch: 0, roll: 0, joints: RELAXED, limbs: legs(body, root, yaw, feet) };
  }
}

/** The rest feet's midpoint in world offset for a heading, so a stand centres the pelvis over its feet. */
function centre(body: IHumanBody, yaw: number): IAutoMovieVector3 {
  const l: IAutoMovieVector3 = body.rest.get("leftFoot")!;
  const r: IAutoMovieVector3 = body.rest.get("rightFoot")!;
  return HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, { x: (l.x + r.x) / 2, y: 0, z: (l.z + r.z) / 2 });
}
