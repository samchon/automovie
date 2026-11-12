import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { stand } from "./stand";
import { standUpright } from "./standUpright";
import { walkDescent } from "./walkDescent";
import { walkFoot } from "./walkFoot";
import { walkReach } from "./walkReach";
import { walkSteps } from "./walkSteps";

/** Seconds before a toe-off over which the ankle's velocity there is read. */
const TICK: number = 1e-3;

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
 * foot, so no plant is ever stretched off its point ({@link walkReach}). A
 * swing joins the stance its foot left, as the leg reached it at toe-off, to
 * the stance it lands in, as the leg reaches it at heel strike
 * ({@link walkFoot}), and the pelvis reads a swinging foot only through those
 * two stances, so a plant is never moved and every displayed channel is
 * continuous through every contact event by construction. The pelvis turns 4° and
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

    /** The trunk's forward inclination from the upright alignment, degrees, shared between the pelvis and the spine by the lumbopelvic rhythm (`HumanTrunk.incline`) and tipped about the hips. */
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
    lean: LEAN,
  });

  /** A walk's forward trunk inclination, degrees (provisional: walkers carry the trunk a few degrees forward of upright, and the inclination grows with speed, Thorstensson et al. 1984, Acta Physiol Scand 121:179). */
  export const LEAN: number = 3;

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
    HumanBound.within("stride", stride, 0.6, 1.3);
    HumanBound.within("armSwing", arms, 0, 2);
    HumanBound.within("elbows", elbows, 0, 30, "degrees");
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
    const pelvis = (t: number): readonly [number, number, number] => {
      const phase: number = steps.phase(t);
      const amount: number = steps.amount(t);
      return [
        0,
        4 * Math.cos(2 * Math.PI * phase) * amount,
        4 * Math.sin(2 * Math.PI * phase) * amount,
      ];
    };
    // A foot as its schedule alone has it, before any pelvis is settled.
    const scheduled = (side: "left" | "right", t: number): walkFoot.IEnd => {
      const foot: walkFoot.IScheduled = steps.foot(side, t);
      return {
        ankle: foot.placement.ankle,
        rotation: foot.placement.rotation,
        toes: foot.toes,
      };
    };
    // A swinging foot between two stances as `at` has them, leaving the first
    // with the rates that stance ends with.
    const swung = (
      side: "left" | "right",
      swing: { off: number; on: number },
      u: number,
      at: (side: "left" | "right", t: number) => walkFoot.IEnd,
    ): walkFoot.IFoot => {
      const from: walkFoot.IEnd = at(side, swing.off);
      const before: walkFoot.IEnd = at(side, swing.off - TICK);
      return walkFoot.swing(body, side, {
        from,
        velocity: Vector3.scale(
          Vector3.subtract(from.ankle, before.ankle),
          1 / TICK,
        ),
        rates: {
          pitch:
            (HumanFoot.pitch(from.rotation) -
              HumanFoot.pitch(before.rotation)) /
            TICK,
          toes: (from.toes - before.toes) / TICK,
        },
        to: at(side, swing.on),
        u,
        seconds: swing.on - swing.off,
        lift: gait.lift,
      });
    };
    // The lowering a swinging leg asks of the pelvis at a share of its swing
    // for the ankle the schedule swings there, read from the schedule alone
    // so that it needs no settled pelvis and every instant settles the same.
    const reaching = (
      side: "left" | "right",
      swing: { off: number; on: number },
      u: number,
    ): number => {
      const t: number = swing.off + u * (swing.on - swing.off);
      return walkReach.short(
        body,
        walkReach.pelvis(body, steps.root(t), steps.yaw(t), pelvis(t), {
          left: steps.foot("left", t),
          right: steps.foot("right", t),
        }).hips[side],
        swung(side, swing, u, scheduled).placement.ankle,
      );
    };
    // A swing's scheduled descent, memoised by its toe-off.
    const descents: Map<string, walkDescent.IPlan> = new Map();
    const settle = (
      t: number,
      feet: Record<"left" | "right", walkFoot.IScheduled>,
    ): walkReach.IGround => {
      const claims: Partial<Record<"left" | "right", number>> = {};
      for (const side of ["left", "right"] as const) {
        const swing = feet[side].swing;
        if (swing === undefined || swing.u < walkDescent.START) continue;
        const key: string = `${side}:${swing.off}`;
        let descent: walkDescent.IPlan | undefined = descents.get(key);
        if (descent === undefined) {
          descent = walkDescent.plan((u: number): number =>
            reaching(side, swing, u),
          );
          descents.set(key, descent);
        }
        claims[side] = walkDescent.claim(
          descent,
          swing.u,
          reaching(side, swing, swing.u),
          -walkReach.CLAIM,
        );
      }
      return walkReach.ground(
        body,
        steps.root(t),
        steps.yaw(t),
        pelvis(t),
        feet,
        claims,
      );
    };
    // A foot's stance as reached at a swing's end, memoised by its second:
    // every sample of that swing reads the same three.
    const ends: Map<string, walkFoot.IEnd> = new Map();
    const end = (side: "left" | "right", t: number): walkFoot.IEnd => {
      const key: string = `${side}:${t}`;
      let out: walkFoot.IEnd | undefined = ends.get(key);
      if (out === undefined) {
        out = settle(t, {
          left: steps.foot("left", t),
          right: steps.foot("right", t),
        }).feet[side];
        ends.set(key, out);
      }
      return out;
    };
    const solve = (
      t: number,
    ): {
      feet: Record<"left" | "right", walkFoot.IScheduled>;
      hips: readonly [number, number, number];
      settled: walkReach.IGround;
      reached: Record<"left" | "right", walkFoot.IEnd>;
    } => {
      const feet: Record<"left" | "right", walkFoot.IScheduled> = {
        left: steps.foot("left", t),
        right: steps.foot("right", t),
      };
      const settled: walkReach.IGround = settle(t, feet);
      const reached: Record<"left" | "right", walkFoot.IEnd> = {
        ...settled.feet,
      };
      for (const side of ["left", "right"] as const) {
        const swing = feet[side].swing;
        if (swing === undefined) continue;
        reached[side] = walkReach.swing(
          body,
          side,
          settled,
          swung(side, swing, swing.u, end),
        );
      }
      return { feet, hips: pelvis(t), settled, reached };
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
        const { feet, hips, settled, reached } = solve(t);
        const root: IAutoMovieVector3 = settled.root;
        const yaw: number = settled.yaw;
        // The trunk inclines by the gait's lean, the pelvis and the spine
        // sharing it, from the upright alignment.
        const inclined = HumanTrunk.incline(
          standUpright.of(body).joints,
          gait.lean,
        );
        const joints: Partial<
          Record<AutoMovieHumanoidBone, readonly [number, number, number]>
        > = {
          ...stand.RELAXED,
          ...inclined.joints,
          hips,
          leftToes: [reached.left.toes, 0, 0],
          rightToes: [reached.right.toes, 0, 0],
          chest: [inclined.joints.chest?.[0] ?? 0, 0, -4 * swing],
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
          const planted: boolean = feet[side].swing === undefined;
          // The knee points over the foot's own heading: the foot has no axial
          // joint, so its toe-out comes from the hip's twist this hint sets.
          // The heading is read off the lateral axis, because a folded shank
          // pitches a swinging foot past vertical.
          const knee: IAutoMovieVector3 = HumanFrame.point(
            {
              origin: HumanFrame.point(
                { origin: root, yaw },
                body.rest.get(`${side}LowerLeg`)!,
              ),
              yaw: HumanFoot.heading(reached[side].rotation),
            },
            { x: 0, y: 0, z: 1 },
          );
          limbs[side === "left" ? "leftLeg" : "rightLeg"] = {
            point: reached[side].ankle,
            bend: knee,
            rotation: reached[side].rotation,
            ...(planted
              ? { planted: true, contact: settled.contacts[side] }
              : {}),
          };
        }
        // The pelvis's share tips the body about the hips, so the legs stay
        // on their footprints; the swinging arms then keep clear of the body,
        // the hands passing the thighs no nearer than they hang beside them.
        return HumanArmClearance.swung(
          body,
          AutoMovieMotionHumanLean.pivot(
            body,
            { root, yaw, pitch: 0, roll: 0, joints, limbs },
            { pitch: inclined.pitch, roll: 0 },
          ),
          ["left", "right"],
        );
      },
    };
  }
}
