import { minimumJerk, seededSmoothNoise } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { standUpright } from "./standUpright";

/**
 * Quiet standing: both feet planted where they are (or under the hips when
 * entered from the air), the pelvis settling over them, the column upright on
 * the plumb line and inclined slightly forward at the ankles
 * ({@link standUpright}), arms hanging relaxed, and the body swaying slightly.
 *
 * The feet keep their entry plants so a stop never slides them; a foot that
 * was not planted lands at its rest place beside the other. The root moves
 * from its entry position to the midpoint of the feet over the first 0.5 s on
 * a minimum-jerk profile and sits 5 mm below full extension so the knees are
 * not locked. Each foot turns out 7° from the heading, the mean adult foot
 * progression angle (Perry and Burnfield, Gait Analysis, 2nd ed.). Arms hang
 * with 5° of shoulder abduction, 12° of elbow flexion and the hand in its
 * position of rest (`HumanHand.shape`, relaxed). Postural sway moves the root on two
 * seeded smooth signals below 1 Hz with an RMS of 3 mm for an elite and 4.8
 * mm for a novice: quiet-stance centre-of-pressure sway of healthy adults is a
 * few millimetres RMS (Prieto et al. 1996), and experts sway less (Perrin et
 * al. 2002, provisional factor 1.6). The window of the noise keeps the start
 * and the end of the stand exact.
 */
export namespace stand {
  /** The action's name. */
  export const name: HumanActionName = "stand";

  /** Cancel table: a stand can be cut anywhere. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /** What quiet standing lets an overlay take: the arms, the hands and the head. */
  export const yields: IHumanActionLaw["yields"] = [
    "head",
    "leftHand",
    "rightHand",
    "leftArm",
    "rightArm",
  ];

  /**
   * Plan a stand.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const duration: number = context.params.seconds ?? 1.5;
    HumanBound.above("seconds", duration, 0, "s");
    const yaw: number = context.entry.posture.yaw;
    const footing: Record<"left" | "right", IAutoMovieVector3> = feet(
      context.body,
      context.entry,
      yaw,
    );
    const upright: standUpright.IAlignment = standUpright.of(context.body);
    const middle: IAutoMovieVector3 = root(context.body, footing, yaw);
    const joints = { ...RELAXED, ...upright.joints };
    const settle: number = Math.min(0.5, duration);
    const from: IAutoMovieVector3 = context.entry.posture.root;
    const sway: number = 0.003 * HumanSkill.sway(context.skill);
    const sx = context.random("swayX");
    const sz = context.random("swayZ");
    return {
      duration,
      events: [{ name: "settled", share: settle / duration }],
      contacts: (["leftFoot", "rightFoot"] as const).map((part) => ({
        part,
        kind: "plant" as const,
        from: 0,
        to: 1,
        support: { kind: "ground" as const },
      })),
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const s: number = minimumJerk(t / settle).s;
        const u: number = t / duration;
        const root: IAutoMovieVector3 = {
          x:
            from.x +
            (middle.x - from.x) * s +
            sway * Math.SQRT2 * seededSmoothNoise(sx, u, duration, 0.8),
          y: from.y + (middle.y - from.y) * s,
          z:
            from.z +
            (middle.z - from.z) * s +
            sway * Math.SQRT2 * seededSmoothNoise(sz, u, duration, 0.8),
        };
        return {
          root,
          yaw,
          pitch: 0,
          roll: 0,
          joints,
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
  export const RELAXED: Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > = (() => {
    const out: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    for (const side of ["left", "right"] as const) {
      Object.assign(out, HumanHand.shape(side, "relaxed"));
      out[`${side}UpperArm`] = [0, 5, 0];
      out[`${side}LowerArm`] = [12, 0, 0];
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
  export function feet(
    body: IHumanBody,
    entry: IHumanEntryState,
    yaw: number,
  ): Record<"left" | "right", IAutoMovieVector3> {
    const frame: HumanFrame.IFrame = {
      origin: { ...entry.posture.root, y: 0 },
      yaw,
    };
    const out = {} as Record<"left" | "right", IAutoMovieVector3>;
    for (const side of ["left", "right"] as const) {
      const foot: IHumanEntryState.IFoot = entry.feet[side];
      const rest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
      out[side] = foot.planted
        ? { ...foot.ankle, y: body.measure.ankleHeight }
        : HumanFrame.point(frame, {
            x: rest.x,
            y: body.measure.ankleHeight,
            z: rest.z,
          });
    }
    return out;
  }

  /**
   * The root of a quiet stance over two ankle points: the pelvis over the
   * feet's midpoint as it stands over its rest feet, shifted forward by the
   * upright alignment's lean (`standUpright`), and `DROP` below its rest
   * height so the planted legs are not at full extension. The single owner of
   * standing root placement: any law that ends or rests standing on its feet
   * places its root here.
   *
   * @param body The body.
   * @param feet Ankle points, world metres.
   * @param yaw The heading, degrees.
   * @returns The root, world metres.
   */
  export function root(
    body: IHumanBody,
    feet: Readonly<Record<"left" | "right", IAutoMovieVector3>>,
    yaw: number,
  ): IAutoMovieVector3 {
    const mid: IAutoMovieVector3 = centre(body, yaw);
    const lean: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: standUpright.of(body).lean },
    );
    return {
      x: (feet.left.x + feet.right.x) / 2 - mid.x + lean.x,
      y: -DROP,
      z: (feet.left.z + feet.right.z) / 2 - mid.z + lean.z,
    };
  }

  /** How far a quiet stance's root sits below its rest height, metres, keeping the planted knees off full extension. */
  export const DROP: number = 0.005;

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
    // The knee points over the foot (Perry and Burnfield): the foot has no
    // axial joint, so its toe-out comes from the hip's twist that this hint sets.
    const knee = (side: "left" | "right"): IAutoMovieVector3 =>
      HumanFrame.point(
        {
          origin: HumanFrame.point(frame, body.rest.get(`${side}LowerLeg`)!),
          yaw: yaw + (side === "left" ? TOE_OUT : -TOE_OUT),
        },
        { x: 0, y: 0, z: 1 },
      );
    // Each foot turns about its toes' joint when the ankle cannot hold it flat (HumanFoot.heelOff).
    return {
      leftLeg: {
        point: feet.left,
        bend: knee("left"),
        rotation: HumanFrame.turn(yaw + TOE_OUT),
        planted: true,
        contact: HumanFoot.offset(body, "left", "mtp"),
      },
      rightLeg: {
        point: feet.right,
        bend: knee("right"),
        rotation: HumanFrame.turn(yaw - TOE_OUT),
        planted: true,
        contact: HumanFoot.offset(body, "right", "mtp"),
      },
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
  export function posture(
    body: IHumanBody,
    at: IAutoMovieVector3,
    yaw: number,
  ): IHumanPosture {
    const frame: HumanFrame.IFrame = { origin: at, yaw };
    const feet = {} as Record<"left" | "right", IAutoMovieVector3>;
    for (const side of ["left", "right"] as const) {
      const rest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
      feet[side] = HumanFrame.point(frame, {
        x: rest.x,
        y: body.measure.ankleHeight,
        z: rest.z,
      });
    }
    const placed: IAutoMovieVector3 = root(body, feet, yaw);
    return {
      root: placed,
      yaw,
      pitch: 0,
      roll: 0,
      joints: { ...RELAXED, ...standUpright.of(body).joints },
      limbs: legs(body, placed, yaw, feet),
    };
  }
}

/** The rest feet's midpoint in world offset for a heading, so a stand centres the pelvis over its feet. */
function centre(body: IHumanBody, yaw: number): IAutoMovieVector3 {
  const l: IAutoMovieVector3 = body.rest.get("leftFoot")!;
  const r: IAutoMovieVector3 = body.rest.get("rightFoot")!;
  return HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw },
    { x: (l.x + r.x) / 2, y: 0, z: (l.z + r.z) / 2 },
  );
}
