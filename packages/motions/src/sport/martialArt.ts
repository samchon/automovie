import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
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
 * Martial-art forms other than kickboxing (#3252): the karate horse stance
 * (kiba-dachi), alternating straight punches from it (choku-zuki) and the
 * tai chi push in a bow stance.
 *
 * - Horse stance: the left foot steps out until the feet stand two
 *   shoulder widths apart (provisional) and the hips sink a fifth of the
 *   thigh (provisional), held, and the foot steps back.
 * - Choku-zuki: from the horse stance, each fist drives from its chamber at
 *   the hip (waist height, at the shoulder's side) to the midline at chest
 *   height an arm's reach ahead, the other fist pulled back to its chamber
 *   at the same time (hikite). Each punch extends in 0.2 s and stays 0.2 s,
 *   inside the 400 ms a choku-zuki takes (VencesBrito et al. 2011); the
 *   hands alternate.
 * - Tai chi push: the lead foot steps ahead 0.35 statures (provisional)
 *   over 3 s as the hips come half the step forward and sink until both
 *   legs reach their feet; over 3 s more the weight shifts to six tenths of
 *   the step as the palms push from before the chest to an arm's reach
 *   ahead, then shifts back over 3 s, and the foot returns over 3 s: the
 *   slow, continuous form of tai chi (Wu and Hitt 2005).
 *
 * Forms are authored as ordered technique lists; no named form's content is
 * shipped. Not drafted: front and back stances as their own rows, blocks,
 * taekwondo's back and turning kicks, judo and wrestling (the grappling
 * owner's) and the tai chi gait.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each technique's geometry, timing with its source, provisional values and what is not drafted.
 * @evidence contracts/development/design.md#principled-representation A law record of root, leg and placed-arm rows on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the kinds, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Places are named grid places and body measures.
 */
export namespace martialArt {
  /** The action's name. */
  export const name: HumanActionName = "martialArt";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      martialArt: ["fromRelax", "smooth"],
    });

  /** The techniques. */
  export type Kind = "horseStance" | "chokuZuki" | "taiChiPush";

  /** A punch's extension and its stay, seconds (VencesBrito et al. 2011: the whole technique in 400 ms). */
  export const PUNCH: number = 0.2;

  /** The tai chi push's shift, seconds each way (provisional). */
  export const PUSH: number = 3;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The technique, the punch count and the hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IParams {
    /** The technique. */
    kind: Kind;

    /** Punches of a choku-zuki series; 4 when absent. */
    count?: number;

    /** Seconds the stance is held; 1 when absent. */
    seconds?: number;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * Plan a martial-art technique.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the count is not a positive whole number or the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation A stance entered by a step and a sink, then the technique's arm rows on named places.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clock, stance rows, then the technique's rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Body measures and named places only; provisional values named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per arm per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the leg arc and the placed arm.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the clock and the stance.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const count: number = p.count ?? 4;
    const hold: number = p.seconds ?? 1;
    if (!(Number.isInteger(count) && count > 0))
      throw new Error("A punch series counts a positive whole number");
    if (!(hold >= 0)) throw new Error("A stance's hold is not negative");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const entry: IHumanPosture = context.entry.posture;
    const axes = { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw };
    const forward: IAutoMovieVector3 = HumanFrame.point(axes, {
      x: 0,
      y: 0,
      z: 1,
    });
    const leftward: IAutoMovieVector3 = HumanFrame.point(axes, {
      x: 1,
      y: 0,
      z: 0,
    });
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
    // Tai chi is slow throughout: its step takes the push's time.
    const step: number = p.kind === "taiChiPush" ? PUSH : 0.6;
    const middle: number =
      p.kind === "chokuZuki" ? count * 2 * PUNCH + PUNCH : hold;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: step,
        attack: p.kind === "taiChiPush" ? PUSH : middle,
        follow: p.kind === "taiChiPush" ? PUSH : 0,
        retract: step,
      }),
      modifiers,
    );
    const into = (s: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], s);
    const root = (
      offset: (s: number) => IAutoMovieVector3,
    ): IAutoMovieMotionHumanPrimitive => ({
      channels: ["root"],
      from: 0,
      to: clock.duration,
      write: (posture: IHumanPosture, s: number): IHumanPosture => ({
        ...posture,
        root: Vector3.add(posture.root, offset(s)),
      }),
    });
    const lead = (
      side: "left" | "right",
      by: IAutoMovieVector3,
      s: number,
    ): HumanFoot.IPlacement =>
      AutoMovieMotionHumanLeg.arc(
        stance[side],
        {
          ankle: Vector3.add(stance[side].ankle, by),
          rotation: stance[side].rotation,
        },
        0.03 * m.stature,
        into(s),
      );
    const bearing = (s: number): boolean => into(s) <= 0 || into(s) >= 1;
    const stepped = (
      side: "left" | "right",
      by: IAutoMovieVector3,
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanLeg.place({
        body,
        side,
        from: 0,
        to: clock.duration,
        placement: (_: IHumanPosture, s: number): HumanFoot.IPlacement =>
          lead(side, by, s),
        planted: bearing,
      });
    const rest = (side: "left" | "right"): AutoMovieMotionHumanArm.IAngles =>
      AutoMovieMotionHumanArm.angles(context.entry.pose, side);
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    const contacts: IHumanContactWindow[] = [
      {
        part: "rightFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
    ];

    if (p.kind === "horseStance" || p.kind === "chokuZuki") {
      const apart: number = Vector3.dot(
        Vector3.subtract(stance.left.ankle, stance.right.ankle),
        leftward,
      );
      const out: number = Math.max(
        0,
        4 * m.shoulderHalfWidth * modifiers.extent - apart,
      );
      const sink: number = 0.2 * m.thigh * modifiers.extent;
      primitives.push(
        stepped("left", Vector3.scale(leftward, out)),
        root(
          (s: number): IAutoMovieVector3 =>
            Vector3.add(Vector3.scale(leftward, (out / 2) * into(s)), {
              x: 0,
              y: -sink * into(s),
              z: 0,
            }),
        ),
      );
    }
    if (p.kind === "chokuZuki") {
      // Punch i starts at `ready + 2 i PUNCH`, by the right hand first.
      const start = (i: number): number =>
        clock.at("ready") + 2 * i * PUNCH * modifiers.tempo;
      const extended = (side: "left" | "right", s: number): number => {
        let w: number = 0;
        for (let i: number = 0; i < count; i++) {
          if ((i % 2 === 0) !== (side === "right")) continue;
          const a: number = start(i);
          const len: number = PUNCH * modifiers.tempo;
          const rise: number = Math.min(1, Math.max(0, (s - a) / len));
          const fall: number = Math.min(
            1,
            Math.max(0, (s - a - 2 * len) / len),
          );
          const ease = (u: number): number => u * u * (3 - 2 * u);
          w = Math.max(w, ease(rise) - ease(fall));
        }
        return w;
      };
      for (const side of ["left", "right"] as const)
        primitives.push(
          ...AutoMovieMotionHumanPlaced.arm({
            body,
            side,
            from: 0,
            to: clock.duration,
            rest: rest(side),
            weight: into,
            surface: "fist",
            shape: "fist",
            place: (posture: IHumanPosture, s: number) => {
              const chamber: IAutoMovieVector3 =
                AutoMovieMotionHumanPlaced.grid(body, posture, side, {
                  height: "waist",
                  lateral: "shoulder",
                  distance: "close",
                });
              const aim: IAutoMovieVector3 = HumanFrame.point(
                {
                  origin: { x: posture.root.x, y: 0, z: posture.root.z },
                  yaw: posture.yaw,
                },
                {
                  x: 0,
                  y:
                    AutoMovieMotionHumanTarget.height(body, "chest") *
                    m.stature,
                  z: m.upperArm + m.forearm,
                },
              );
              return {
                point: Vector3.lerp(chamber, aim, extended(side, s)),
                facing: HumanFrame.point(
                  { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
                  { x: 0, y: 0, z: 1 },
                ),
              };
            },
            bend: "tucked",
          }),
        );
    }
    if (p.kind === "taiChiPush") {
      const stride: number = 0.35 * m.stature * modifiers.extent;
      const shift = (s: number): number =>
        clock.envelope(["strokeStart", "stroke"], ["stroke", "strokeEnd"], s);
      // The hips travel between the feet and sink until each bearing leg
      // reaches its foot: the bow stance's depth follows from the stride.
      primitives.push(
        AutoMovieMotionHumanLean.sway({
          body,
          from: 0,
          to: clock.duration,
          angles: (): AutoMovieMotionHumanLean.IAngles => ({
            pitch: 0,
            roll: 0,
          }),
          shift: (s: number): IAutoMovieVector3 => ({
            x: 0,
            y: 0,
            z: stride * (0.5 * into(s) + 0.1 * shift(s)),
          }),
          legs: (s: number) => ({
            leftLeg: AutoMovieMotionHumanLeg.goal(
              body,
              entry,
              "left",
              lead("left", Vector3.scale(forward, stride), s),
              bearing(s),
            ),
            rightLeg: AutoMovieMotionHumanLeg.goal(
              body,
              entry,
              "right",
              stance.right,
              true,
            ),
          }),
        }),
        stepped("left", Vector3.scale(forward, stride)),
      );
      for (const side of ["left", "right"] as const)
        primitives.push(
          ...AutoMovieMotionHumanPlaced.arm({
            body,
            side,
            from: 0,
            to: clock.duration,
            rest: rest(side),
            weight: into,
            place: (posture: IHumanPosture, s: number) => ({
              point: Vector3.lerp(
                AutoMovieMotionHumanPlaced.grid(body, posture, side, {
                  height: "chest",
                  lateral: "inside",
                  distance: "near",
                }),
                AutoMovieMotionHumanPlaced.grid(body, posture, side, {
                  height: "chest",
                  lateral: "inside",
                  distance: "far",
                }),
                shift(s),
              ),
              facing: HumanFrame.point(
                { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
                { x: 0, y: 0, z: 1 },
              ),
              forward: { x: 0, y: 1, z: 0 },
            }),
            bend: "front",
          }),
        );
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, contacts),
      clock,
      primitives,
    });
  }
}
