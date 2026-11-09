import type { AutoMovieHumanoidBone, IAutoMovieMotionEvent, IAutoMovieVector3 } from "@automovie/interface";

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
 * foot, so no plant is ever stretched off its point. The pelvis turns 4° and
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
   * Cancel table. Another walk, an approach or a stop may cut any step: each
   * plans from the entry feet. A standing action (looking, gesturing, resting,
   * sitting) may cut only after the last footfall, once both feet are down.
   */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    walk: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    approach: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    look: [{ window: ["lastFootfall", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    gesture: [{ window: ["lastFootfall", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    rest: [{ window: ["lastFootfall", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    sit: [{ window: ["lastFootfall", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /** Parameters. */
  export interface IParams {
    /** The floor point to stop at, world metres. */
    to: IAutoMovieVector3;

    /** The pace; `normal` when absent. */
    pace?: "slow" | "normal" | "fast";
  }

  /** Froude number of each pace (Alexander 1984; Bohannon 1997 speeds at a 0.93 m hip). */
  export const FROUDE: Readonly<Record<NonNullable<IParams["pace"]>, number>> = { slow: 0.12, normal: 0.2, fast: 0.32 };

  /**
   * Plan a walk.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const l: number = m.hipHeight;
    const froude: number = FROUDE[context.params.pace ?? "normal"];
    const speed: number = Math.sqrt(froude * 9.81 * l);
    const longest: number = 1.2 * l * Math.sqrt(Math.sqrt(froude));
    const steps: walkSteps.IPlan = walkSteps.plan({
      body,
      entry: context.entry,
      to: context.params.to,
      speed,
      longest,
      period: (seconds: number): number => HumanSkill.jitter(context.skill, context.random("period"), seconds),
    });
    const duration: number = steps.duration;
    const events: IAutoMovieMotionEvent[] = steps.events.map((e) => ({ name: e.name, share: e.seconds / duration }));
    const contacts: IHumanContactWindow[] = steps.stances.map((s) => ({
      part: s.side === "left" ? "leftFoot" : "rightFoot",
      kind: "plant",
      from: s.from / duration,
      to: s.to / duration,
      support: { kind: "ground" },
    }));
    return {
      duration,
      events,
      contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const yaw: number = steps.yaw(t);
        const phase: number = steps.phase(t);
        const amount: number = steps.amount(t);
        const swing: number = Math.sin(2 * Math.PI * phase) * amount;
        const hips: readonly [number, number, number] = [0, 4 * Math.cos(2 * Math.PI * phase) * amount, 4 * swing];
        const feet: Record<"left" | "right", walkSteps.IFoot> = { left: steps.foot("left", t), right: steps.foot("right", t) };
        const reached = walkSteps.reach(body, steps.root(t), yaw, hips, feet);
        const root: IAutoMovieVector3 = reached.root;
        const upright: standUpright.IAlignment = standUpright.of(body);
        const joints: Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> = {
          ...stand.RELAXED,
          ...upright.joints,
          hips,
          leftToes: [reached.toes.left, 0, 0],
          rightToes: [reached.toes.right, 0, 0],
          chest: [upright.joints.chest?.[0] ?? 0, 0, -4 * swing],
          leftUpperArm: [-15 * swing, 5, 0],
          rightUpperArm: [15 * swing, 5, 0],
          leftLowerArm: [22 - 8 * swing, 0, 0],
          rightLowerArm: [22 + 8 * swing, 0, 0],
        };
        const limbs: IHumanPosture["limbs"] = {};
        for (const side of ["left", "right"] as const) {
          const foot: walkSteps.IFoot = feet[side];
          // The knee points over the foot's own heading: the foot has no axial
          // joint, so its toe-out comes from the hip's twist this hint sets.
          const knee: IAutoMovieVector3 = HumanFrame.point(
            { origin: HumanFrame.point({ origin: root, yaw }, body.rest.get(`${side}LowerLeg`)!), yaw: HumanFrame.heading(foot.placement.rotation) },
            { x: 0, y: 0, z: 1 },
          );
          limbs[side === "left" ? "leftLeg" : "rightLeg"] = {
            point: reached.ankles[side],
            bend: knee,
            rotation: reached.rotations[side],
            ...(foot.planted ? { planted: true } : {}),
          };
        }
        return { root, yaw, pitch: 0, roll: 0, joints, limbs };
      },
    };
  }

}
