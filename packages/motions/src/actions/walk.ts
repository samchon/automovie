import {
  Quaternion,
  Vector3,
  minimumJerk,
  wrapDegrees,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { stand } from "./stand";
import { standUpright } from "./standUpright";
import { walkSteps } from "./walkSteps";

/** Seconds either side of a contact event at which its stance and swing are read. */
const EPSILON: number = 1e-6;

/**
 * Walking to a floor point in whole steps, ending with the feet side by side.
 *
 * Speed comes from dynamic similarity (Alexander 1984): people of different
 * leg length walk alike at equal Froude number `v^2 / (g l)`, so each pace is
 * a Froude number on the hip height `l`: slow 0.12, normal 0.20 and fast
 * 0.32, which give 1.05, 1.35 and 1.71 m/s at a 0.93 m hip, inside the
 * comfortable and fast adult ranges (Bohannon 1997). Step length grows with
 * the square root of speed (Grieve and Gear 1966): `1.2 l sqrt(sqrt(Fr))`,
 * 0.8 hip heights at the normal pace (about 0.4 stature, Perry and Burnfield);
 * the step count is rounded up so every step is at most that long.
 *
 * Each foot follows the three rockers of stance with its contact point fixed
 * on the floor, and swings between footprints on a minimum-jerk path lifted
 * clear of the floor ({@link walkSteps}): 60 % stance and 40 % swing of each
 * stride, so each double support lasts a tenth of a stride (Perry and
 * Burnfield). The pelvis progresses at the walking speed with smooth start
 * and stop, rises and falls 2.5 cm about its mean twice a stride (the 4 to 5
 * cm vertical excursion of the centre of mass), sways 2 cm toward the stance
 * foot, and is lowered wherever a planted leg could not otherwise reach its
 * foot, so no plant is ever stretched off its point. Where a foot lands or
 * leaves, the stance and the swing are reached under different limits (the
 * heel and forefoot rockers' dorsal clamps, the swing's reach and ankle
 * range), so the swing absorbs the difference: from toe-off its foot goal,
 * the root and the heading carry the stance's values at the event as an
 * offset decaying over the first `walkSteps.FADE` of the swing, and before
 * heel strike they gather the stance's offset over the last, on a
 * minimum-jerk weight. A plant is never moved, and every displayed channel
 * is continuous through every contact event (Bollo 2018's offset decay,
 * applied to the foot goals at the contact switch). The pelvis turns 4° and
 * tilts 4° with the stride, the chest counter-rotates, and the arms swing
 * opposite the legs about 15° with the elbows bent 15 to 30° (Perry and
 * Burnfield, normal gait kinematics).
 *
 * The engine's gait owners cannot express this, for stated reasons, so the
 * walk plans its own footprints and reuses the engine for everything else
 * (minimum-jerk profiles, the limb fit, the transitions):
 *
 * - `IAutoMovieGait`, `gaitMotion` and `HUMANOID_GAITS` oscillate limb angles
 *   periodically; their stance and swing intervals "do not constrain a
 *   resolved foot to the ground" (`IAutoMovieGaitLimb.duty`), so a footprint, a
 *   stop at a point and a whole-step count cannot be stated in them.
 * - `locomoteMotion` and `followPathMotion` carry that oscillation along a
 *   distance in whole cycles, compressing a short trip, and start from rest,
 *   not from an entry state, so a walk cannot continue a cut.
 * - `plantStanceFeet` and `pinStanceTargets` pin oscillated feet after the
 *   fact and "do not guarantee exact no-skate contact"; here every planted
 *   foot is an IK goal on its footprint, so the 5 mm slip bound holds by
 *   construction rather than by repair.
 *
 * The audits use the engine's `contactMask` to read stance from the result.
 *
 * Proficiency changes nothing here except the cross-task timing variability
 * of the step period; no locomotion study of skill differences in ordinary
 * walking was located, so walking skill is left unscaled.
 */
export namespace walk {
  /** The action's name. */
  export const name: HumanActionName = "walk";

  /**
   * Cancel table. Another walk, an approach, a jump or a stop may cut any
   * step: a stance foot is always planted, and each plans from the entry feet. A standing action (looking, gesturing, resting,
   * sitting) may cut only after the last footfall, once both feet are down.
   */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    walk: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    jump: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
    run: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    approach: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    look: [
      {
        window: ["lastFootfall", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
    gesture: [
      {
        window: ["lastFootfall", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
    rest: [
      {
        window: ["lastFootfall", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
    sit: [
      {
        window: ["lastFootfall", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
  };

  /** Parameters. */
  export interface IParams {
    /** The floor point to stop at, world metres. */
    to: IAutoMovieVector3;

    /** The pace; `normal` when absent. */
    pace?: "slow" | "normal" | "fast";

    /** Floor points passed in order before `to`, world metres. */
    via?: IAutoMovieVector3[];

    /** The heading at arrival, degrees about +Y (0 faces +Z); the last leg's direction when absent. */
    face?: number;

    /** Step-length scale, an Effort hook (a hurried or a dragging gait), in [0.6, 1.3]; 1 when absent. */
    stride?: number;

    /** Arm-swing scale, an Effort hook, in [0, 2]; 1 when absent. */
    armSwing?: number;

    /** Elbows held out from the body, shoulder abduction added, degrees in [0, 30]; 0 when absent. */
    elbows?: number;
  }

  /** Froude number of each pace (Alexander 1984; Bohannon 1997 speeds at a 0.93 m hip). */
  export const FROUDE: Readonly<Record<NonNullable<IParams["pace"]>, number>> =
    { slow: 0.12, normal: 0.2, fast: 0.32 };

  /** A gait the stepping plan runs: its speed, its step and swing, its pelvis and its arms. */
  export interface IGait {
    /** Froude number, `v² / (g l)`. */
    froude: number;

    /** The longest step in hip heights for the Froude number. */
    step(froude: number): number;

    /** Swing duration in step periods. */
    swing: number;

    /** Vertical oscillation lowest at mid-stance, hip heights; a walk's own when absent. */
    bob?: { mean: number; amplitude: number };

    /** Mid-swing ankle lift, hip heights. */
    lift: number;

    /** Shoulder swing amplitude, elbow flexion and its swing, degrees. */
    arms: { shoulder: number; elbow: number; swing: number };

    /** Forward trunk lean added to the upright alignment, degrees of chest and spine flexion each. */
    lean: number;
  }

  /**
   * The walking gait of a Froude number: a step of `1.2 l Fr^0.25`, at most
   * 0.85 hip heights, the fast-walking step that keeps the trailing hip's
   * extension at toe-off inside its range (about 0.8 m at 1.75 m stature), and
   * 40 % of the stride in swing.
   */
  export const walking = (froude: number): IGait => ({
    froude,
    step: (fr: number): number =>
      Math.min(0.85, 1.2 * Math.sqrt(Math.sqrt(fr))),
    swing: 0.8,
    lift: 0.07,
    arms: { shoulder: 15, elbow: 22, swing: 8 },
    lean: 0,
  });

  /**
   * Plan a walk.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    return locomote(context, walking(FROUDE[context.params.pace ?? "normal"]));
  }

  /**
   * Plan stepping locomotion in a gait: footprints, their timing, the pelvis
   * and the arms, shared by walking and running.
   *
   * @param context The action's context; `pace` is read by the caller only.
   * @param gait The gait.
   * @returns The plan.
   */
  export function locomote(
    context: IHumanActionContext<Omit<IParams, "pace">>,
    gait: IGait,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const l: number = m.hipHeight;
    const froude: number = gait.froude;
    const speed: number = Math.sqrt(froude * 9.81 * l);
    const p = context.params;
    const stride: number = p.stride ?? 1;
    const arms: number = p.armSwing ?? 1;
    const elbows: number = p.elbows ?? 0;
    if (!(stride >= 0.6 && stride <= 1.3))
      throw new Error(`walk.stride must lie in [0.6, 1.3], got ${stride}`);
    if (!(arms >= 0 && arms <= 2))
      throw new Error(`walk.armSwing must lie in [0, 2], got ${arms}`);
    if (!(elbows >= 0 && elbows <= 30))
      throw new Error(`walk.elbows must lie in [0, 30], got ${elbows}`);
    const longest: number = stride * l * gait.step(froude);
    const steps: walkSteps.IPlan = walkSteps.plan({
      body,
      entry: context.entry,
      to: p.to,
      ...(p.via === undefined ? {} : { via: p.via }),
      ...(p.face === undefined ? {} : { face: p.face }),
      speed,
      longest,
      period: (seconds: number): number =>
        HumanSkill.jitter(context.skill, context.random("period"), seconds),
      swing: gait.swing,
      lift: gait.lift,
      ...(gait.bob === undefined ? {} : { bob: gait.bob }),
    });
    const duration: number = steps.duration;
    const events: IAutoMovieMotionEvent[] = steps.events.map((e) => ({
      name: e.name,
      share: e.seconds / duration,
    }));
    const contacts: IHumanContactWindow[] = steps.stances.map((s) => ({
      part: s.side === "left" ? "leftFoot" : "rightFoot",
      kind: "plant",
      from: s.from / duration,
      to: s.to / duration,
      support: { kind: "ground" },
    }));
    // The unconstrained reach at a second, memoised for the contact events'
    // two sides, which every swing sample near them reads.
    const solved: Map<number, ReturnType<typeof solveAt>> = new Map();
    const solveAt = (t: number) => {
      const phase: number = steps.phase(t);
      const amount: number = steps.amount(t);
      const hips: readonly [number, number, number] = [
        0,
        4 * Math.cos(2 * Math.PI * phase) * amount,
        4 * Math.sin(2 * Math.PI * phase) * amount,
      ];
      const feet: Record<"left" | "right", walkSteps.IFoot> = {
        left: steps.foot("left", t),
        right: steps.foot("right", t),
      };
      return {
        hips,
        feet,
        reached: walkSteps.reach(body, steps.root(t), steps.yaw(t), hips, feet),
      };
    };
    const solve = (t: number): ReturnType<typeof solveAt> => {
      const cached = solved.get(t);
      if (cached !== undefined) return cached;
      const out = solveAt(t);
      if (steps.events.some((e) => Math.abs(e.seconds - t) <= 2 * EPSILON))
        solved.set(t, out);
      return out;
    };
    // A side's last contact event of a kind at or before a second (-1) or its next after it (+1).
    const contact = (
      side: "left" | "right",
      kind: "ToeOff" | "HeelStrike",
      t: number,
      direction: -1 | 1,
    ): number | undefined => {
      let best: number | undefined;
      for (const e of steps.events) {
        if (!e.name.startsWith(`${side}${kind}`)) continue;
        if (direction < 0 ? e.seconds > t : e.seconds <= t) continue;
        if (
          best === undefined ||
          (direction < 0 ? e.seconds > best : e.seconds < best)
        )
          best = e.seconds;
      }
      return best;
    };
    return {
      duration,
      events,
      contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const phase: number = steps.phase(t);
        const amount: number = steps.amount(t);
        const swing: number = Math.sin(2 * Math.PI * phase) * amount;
        const { feet, hips, reached: raw } = solve(t);
        // The swing absorbs the stance's values at its toe-off and heel strike.
        const ankles = { ...raw.ankles };
        const rotations = { ...raw.rotations };
        const toes = { ...raw.toes };
        let root: IAutoMovieVector3 = raw.root;
        let yaw: number = raw.yaw;
        for (const side of ["left", "right"] as const) {
          const off: number | undefined = contact(side, "ToeOff", t, -1);
          const on: number | undefined = contact(side, "HeelStrike", t, 1);
          if (feet[side].planted || off === undefined || on === undefined)
            continue;
          const fade: number = walkSteps.FADE * (on - off);
          const event: number | undefined =
            t - off < fade ? off : on - t < fade ? on : undefined;
          if (event === undefined) continue;
          const weight: number =
            event === off
              ? 1 - minimumJerk((t - off) / fade).s
              : minimumJerk(1 - (on - t) / fade).s;
          const stance = solve(
            event === off ? off - EPSILON : on + EPSILON,
          ).reached;
          const free = solve(
            event === off ? off + EPSILON : on - EPSILON,
          ).reached;
          ankles[side] = Vector3.add(
            ankles[side],
            Vector3.scale(
              Vector3.subtract(stance.ankles[side], free.ankles[side]),
              weight,
            ),
          );
          rotations[side] = Quaternion.normalize(
            Quaternion.multiply(
              Quaternion.slerp(
                Quaternion.identity(),
                Quaternion.multiply(
                  stance.rotations[side],
                  Quaternion.inverse(free.rotations[side]),
                ),
                weight,
              ),
              rotations[side],
            ),
          );
          toes[side] += (stance.toes[side] - free.toes[side]) * weight;
          root = Vector3.add(
            root,
            Vector3.scale(Vector3.subtract(stance.root, free.root), weight),
          );
          yaw += wrapDegrees(stance.yaw - free.yaw) * weight;
        }
        const reached = { ...raw, ankles, rotations, toes };
        const upright: standUpright.IAlignment = standUpright.of(body);
        const joints: Partial<
          Record<AutoMovieHumanoidBone, readonly [number, number, number]>
        > = {
          ...stand.RELAXED,
          ...upright.joints,
          spine: [(upright.joints.spine?.[0] ?? 0) + gait.lean, 0, 0],
          hips,
          leftToes: [reached.toes.left, 0, 0],
          rightToes: [reached.toes.right, 0, 0],
          chest: [(upright.joints.chest?.[0] ?? 0) + gait.lean, 0, -4 * swing],
          leftUpperArm: [-gait.arms.shoulder * arms * swing, 5 + elbows, 0],
          rightUpperArm: [gait.arms.shoulder * arms * swing, 5 + elbows, 0],
          leftLowerArm: [
            gait.arms.elbow - gait.arms.swing * arms * swing,
            0,
            0,
          ],
          rightLowerArm: [
            gait.arms.elbow + gait.arms.swing * arms * swing,
            0,
            0,
          ],
        };
        const limbs: IHumanPosture["limbs"] = {};
        for (const side of ["left", "right"] as const) {
          const foot: walkSteps.IFoot = feet[side];
          // The knee points over the foot's own heading: the foot has no axial
          // joint, so its toe-out comes from the hip's twist this hint sets.
          const knee: IAutoMovieVector3 = HumanFrame.point(
            {
              origin: HumanFrame.point(
                { origin: root, yaw },
                body.rest.get(`${side}LowerLeg`)!,
              ),
              yaw: HumanFrame.heading(foot.placement.rotation),
            },
            { x: 0, y: 0, z: 1 },
          );
          limbs[side === "left" ? "leftLeg" : "rightLeg"] = {
            point: reached.ankles[side],
            bend: knee,
            rotation: reached.rotations[side],
            ...(foot.planted ? { planted: true } : {}),
            ...(reached.contacts[side] === undefined
              ? {}
              : { contact: reached.contacts[side] }),
          };
        }
        return { root, yaw, pitch: 0, roll: 0, joints, limbs };
      },
    };
  }
}
