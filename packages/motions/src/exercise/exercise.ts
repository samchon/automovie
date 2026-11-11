import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * A standing bodyweight exercise counted in repetitions (#3245, M24): the
 * squat, the forward lunge, high knees and the jumping jack (ACSM's
 * Guidelines for Exercise Testing and Prescription, 11th ed.).
 *
 * Every repetition has four spans: `eccentricStart` (lowering, or opening),
 * `bottom` (the pause at the bottom), `concentricStart` (rising, or closing)
 * and `top` (the pause on top), numbered from 1, so the counts are exact and
 * the tempo is the declared eccentric, pause and concentric seconds (2, 0, 1
 * when absent, the common 2-0-1 tempo; provisional).
 *
 * - Squat: the hips sink and the trunk pitches over the planted feet
 *   (`AutoMovieMotionHumanTrunk.crouch`), the hip shift solved for balance.
 *   The depth names the thigh's angle from the horizontal at the bottom:
 *   `quarter` 60, `half` 45, `parallel` 0 degrees; the hips' drop follows
 *   from the thigh and shank lengths with the shank leaning forward up to 35
 *   degrees (provisional, the ankle's working dorsiflexion), and the trunk
 *   pitches 15, 25 or 40 degrees (provisional).
 * - Lunge: the lead foot steps ahead 0.4 statures (provisional), the hips
 *   travel half the step forward and drop by three quarters of the thigh
 *   (provisional), and the foot steps back.
 * - High knees: one knee rises per repetition, alternating, the ankle under
 *   a thigh raised to the horizontal ahead of the hip, the hips carried over
 *   the standing foot.
 * - Jumping jack: the feet jump apart to 1.5 half shoulder widths each side
 *   of the midline (provisional) with the arms raised overhead, and back; a hop of
 *   4 cm (provisional) lifts the body in each jump, the feet free while
 *   they travel.
 *
 * Events: the numbered repetition instants. A cut at a repetition's `top`
 * into standing or another exercise is legal.
 *
 * Not drafted: floor exercises (push-up, plank, sit-up, glute bridge,
 * mountain climber, burpee), loaded lifts, machines and skipping rope; they
 * need hand and back supports on the floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the exercises, the repetition structure, each one's geometry and its provisional values, the events and what is not drafted.
 * @evidence contracts/development/design.md#principled-representation A law record whose exercises are rows of crouch, leg and arm primitives over a repetition clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the kinds, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every length is a share of the body's measures.
 */
export namespace exercise {
  /** The action's name. */
  export const name: HumanActionName = "exercise";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      exercise: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /** The exercises. */
  export type Kind = "squat" | "lunge" | "highKnees" | "jumpingJack";

  /** A squat's depth by name. */
  export type Depth = "quarter" | "half" | "parallel";

  /** The thigh's angle from the horizontal at the bottom, degrees, by depth. */
  export const THIGH: Readonly<Record<Depth, number>> = {
    quarter: 60,
    half: 45,
    parallel: 0,
  };

  /** The trunk's pitch at the bottom, degrees, by depth (provisional). */
  export const PITCH: Readonly<Record<Depth, number>> = {
    quarter: 15,
    half: 25,
    parallel: 40,
  };

  /** The shank's greatest forward lean in a squat, degrees (provisional). */
  export const SHANK: number = 35;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The exercise, the count, the depth, the tempo and the lead side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tempo is three seconds, as the issue's sketch writes it.
   */
  export interface IParams {
    /** The exercise. */
    kind: Kind;

    /** Repetitions; 3 when absent. */
    reps?: number;

    /** A squat's depth; `parallel` when absent. */
    depth?: Depth;

    /** Eccentric, bottom pause and concentric seconds; `[2, 0, 1]` when absent. */
    tempo?: readonly [number, number, number];

    /** The lunge's lead leg, or the first knee raised; `right` when absent. */
    side?: "left" | "right";

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * The hips' drop of a squat to a depth.
   *
   * @param m The body's measure.
   * @param depth The depth.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the geometry and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The standing leg's length less the hip's height over the ankle with the thigh at its angle and the shank leaning at most `SHANK`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two angles and one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shank's lean is clamped at the named limit, so the hips move back rather than the ankle overflexing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function drop(
    m: { thigh: number; shank: number },
    depth: Depth,
  ): number {
    const alpha: number = (THIGH[depth] * Math.PI) / 180;
    const beta: number = Math.min(
      (SHANK * Math.PI) / 180,
      Math.asin(Math.min(1, (m.thigh * Math.cos(alpha)) / m.shank)),
    );
    return (
      m.thigh + m.shank - (m.shank * Math.cos(beta) + m.thigh * Math.sin(alpha))
    );
  }

  /**
   * Plan an exercise.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the count is not a positive whole number or a tempo span is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation One repetition clock; per repetition a crouch, a step, a lift or a jump over its four spans.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clock, then one branch per kind.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Lengths are shares of the measure; provisional values are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One balance solve per squat repetition at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the crouch, the leg placement and the placed arm.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the clock and the stance.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const reps: number = p.reps ?? 3;
    if (!(Number.isInteger(reps) && reps > 0))
      throw new Error("An exercise repeats a positive whole number of times");
    const tempo: readonly [number, number, number] = p.tempo ?? [2, 0, 1];
    if (tempo.some((s: number): boolean => !(s >= 0)))
      throw new Error("An exercise's tempo spans are not negative");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const top: number = 0.3;
    const timed: AutoMovieMotionClock.IClock = AutoMovieMotionClock.sequence([
      ...AutoMovieMotionClock.repeat(
        [
          { name: "eccentricStart", seconds: tempo[0] },
          { name: "bottom", seconds: tempo[1] },
          { name: "concentricStart", seconds: tempo[2] },
          { name: "top", seconds: top },
        ],
        reps,
      ),
    ]);
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.of(timed.duration, [
        ...timed.instants,
        { name: "relax", seconds: timed.duration },
      ]),
      modifiers,
      { holds: [] },
    );
    const entry: IHumanPosture = context.entry.posture;
    const stance: Record<"left" | "right", HumanFoot.IPlacement> = {
      left: {
        ankle: context.entry.feet.left.ankle,
        rotation: context.entry.feet.left.rotation,
      },
      right: {
        ankle: context.entry.feet.right.ankle,
        rotation: context.entry.feet.right.rotation,
      },
    };
    const frame: HumanFrame.IFrame = {
      origin: { x: 0, y: 0, z: 0 },
      yaw: entry.yaw,
    };
    const forward: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 0,
      y: 0,
      z: 1,
    });
    const left: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 1,
      y: 0,
      z: 0,
    });
    const lead: "left" | "right" = p.side ?? "right";
    const trail: "left" | "right" = lead === "right" ? "left" : "right";
    // The share of the way into repetition i's low (or open) position.
    const into = (i: number, seconds: number): number =>
      clock.envelope(
        [`eccentricStart${i}`, `bottom${i}`],
        [`concentricStart${i}`, `top${i}`],
        seconds,
      );
    const any = (seconds: number): number => {
      let w: number = 0;
      for (let i: number = 1; i <= reps; i++) w = Math.max(w, into(i, seconds));
      return w;
    };
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    const contacts: IHumanContactWindow[] = [];
    const shifted = (
      placement: HumanFoot.IPlacement,
      by: IAutoMovieVector3,
    ): HumanFoot.IPlacement => ({
      ankle: Vector3.add(placement.ankle, by),
      rotation: placement.rotation,
    });
    const root = (
      offset: (seconds: number) => IAutoMovieVector3,
    ): IAutoMovieMotionHumanPrimitive => ({
      channels: ["root"],
      from: 0,
      to: clock.duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => ({
        ...posture,
        root: Vector3.add(posture.root, offset(seconds)),
      }),
    });

    switch (p.kind) {
      case "squat": {
        const depth: Depth = p.depth ?? "parallel";
        for (let i: number = 1; i <= reps; i++)
          primitives.push(
            AutoMovieMotionHumanTrunk.crouch({
              body,
              standing: entry,
              clock,
              rise: [`eccentricStart${i}`, `bottom${i}`],
              fall: [`concentricStart${i}`, `top${i}`],
              depth: drop(m, depth) * modifiers.extent,
              pitch: PITCH[depth] * modifiers.extent,
            }),
          );
        contacts.push(...AutoMovieMotionHumanBase.plants());
        break;
      }
      case "lunge": {
        const stride: number = 0.4 * m.stature * modifiers.extent;
        const sink: number = 0.75 * m.thigh * modifiers.extent;
        // The step out over the first half of the lowering, back over the second half of the rise.
        primitives.push(
          root(
            (s: number): IAutoMovieVector3 =>
              Vector3.add(Vector3.scale(forward, (stride / 2) * any(s)), {
                x: 0,
                y: -sink * any(s) ** 2,
                z: 0,
              }),
          ),
          AutoMovieMotionHumanLeg.place({
            body,
            side: lead,
            from: 0,
            to: clock.duration,
            placement: (_: IHumanPosture, s: number): HumanFoot.IPlacement =>
              AutoMovieMotionHumanLeg.arc(
                stance[lead],
                shifted(stance[lead], Vector3.scale(forward, stride)),
                0.05 * m.stature,
                Math.min(1, 2 * any(s)),
              ),
            planted: (s: number): boolean => any(s) <= 0 || any(s) >= 0.5,
          }),
          AutoMovieMotionHumanLeg.plant(
            body,
            clock,
            trail,
            ["start", "end"],
            stance[trail],
          ),
        );
        contacts.push({
          part: `${trail}Foot`,
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        });
        break;
      }
      case "highKnees": {
        const raised = (side: "left" | "right"): HumanFoot.IPlacement => {
          const hip: IAutoMovieVector3 = HumanFrame.point(
            { origin: entry.root, yaw: entry.yaw },
            body.rest.get(`${side}UpperLeg`)!,
          );
          return {
            ankle: Vector3.add(
              { x: hip.x, y: hip.y - m.shank, z: hip.z },
              Vector3.scale(forward, m.thigh * modifiers.extent),
            ),
            rotation: stance[side].rotation,
          };
        };
        const sideOf = (i: number): "left" | "right" =>
          i % 2 === 1 ? lead : trail;
        const lifted = (side: "left" | "right", s: number): number => {
          let w: number = 0;
          for (let i: number = 1; i <= reps; i++)
            if (sideOf(i) === side) w = Math.max(w, into(i, s));
          return w;
        };
        const half: number =
          Vector3.length(
            Vector3.subtract(stance.left.ankle, stance.right.ankle),
          ) / 2;
        primitives.push(
          root(
            (s: number): IAutoMovieVector3 =>
              Vector3.scale(
                left,
                half * (lifted("right", s) - lifted("left", s)),
              ),
          ),
        );
        for (const side of ["left", "right"] as const)
          primitives.push(
            AutoMovieMotionHumanLeg.place({
              body,
              side,
              from: 0,
              to: clock.duration,
              placement: (_: IHumanPosture, s: number): HumanFoot.IPlacement =>
                AutoMovieMotionHumanLeg.between(
                  stance[side],
                  raised(side),
                  lifted(side, s),
                ),
              planted: (s: number): boolean => lifted(side, s) <= 0,
            }),
          );
        break;
      }
      case "jumpingJack": {
        const width: number = 1.5 * m.shoulderHalfWidth * modifiers.extent;
        primitives.push(
          root((s: number): IAutoMovieVector3 => {
            const w: number = any(s);
            return { x: 0, y: 0.04 * 4 * w * (1 - w), z: 0 };
          }),
        );
        for (const side of ["left", "right"] as const) {
          const out: HumanFoot.IPlacement = shifted(
            stance[side],
            Vector3.scale(
              left,
              (side === "left" ? 1 : -1) *
                Math.max(
                  0,
                  width -
                    Math.abs(
                      Vector3.dot(
                        Vector3.subtract(stance[side].ankle, entry.root),
                        left,
                      ),
                    ),
                ),
            ),
          );
          primitives.push(
            AutoMovieMotionHumanLeg.place({
              body,
              side,
              from: 0,
              to: clock.duration,
              placement: (_: IHumanPosture, s: number): HumanFoot.IPlacement =>
                AutoMovieMotionHumanLeg.between(stance[side], out, any(s)),
              planted: (s: number): boolean => any(s) <= 0 || any(s) >= 1,
            }),
            ...AutoMovieMotionHumanPlaced.arm({
              body,
              side,
              from: 0,
              to: clock.duration,
              rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
              weight: any,
              place: (posture: IHumanPosture) => ({
                point: AutoMovieMotionHumanPlaced.grid(body, posture, side, {
                  height: "overhead",
                  lateral: "outside",
                  distance: "close",
                }),
                facing: HumanFrame.point(
                  { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
                  { x: side === "left" ? -1 : 1, y: 0, z: 0 },
                ),
              }),
              bend: "raised",
            }),
          );
        }
        break;
      }
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, contacts),
      clock,
      primitives,
    });
  }
}
