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
 * Racket and golf positions without the stroke itself (#3249): the tennis
 * ready position, the split step, and the golf address with its waggle. No
 * racket or club is held; the hands stand on the implied handle.
 *
 * - Ready position: the feet step apart to two shoulder widths, the knees
 *   give 4 % of the stature and the trunk leans 15 degrees, the racket hand
 *   on the handle at waist height before the body and the other hand a hand
 *   ahead on the throat (provisional places).
 * - Split step: from the ready position's width, a small hop of 3 % of the
 *   stature (provisional) in 0.3 s, landing a quarter shoulder width wider
 *   on each side, the step that precedes every stroke (Elliott et al. 1986
 *   place it before the serve's backswing; here before any stroke).
 * - Golf address: the trunk hinges 35 degrees at the hips over slightly
 *   flexed knees (provisional), the two hands together on the grip hanging
 *   below the shoulders, and the waggle moves them a twentieth of the arm
 *   forward and back twice.
 *
 * Each is a phrase: into the position in 0.6 s, the stroke (the hop or the
 * waggle), held, and back in 0.6 s.
 *
 * Not drafted: groundstrokes, volleys, serves, smashes, badminton and table
 * tennis strokes, the golf swing, chip and putt. They are implement strikes
 * of the ball-strike owner (#3244), whose implement file does not exist
 * yet; the lunge to the net is the exercise lunge's row.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each position's geometry, timing, sources and provisional values, and the gaps with their owner.
 * @evidence contracts/development/design.md#principled-representation A law record of crouch, leg, root and placed-arm rows over one phrase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the kinds, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares of the body and named grid places.
 */
export namespace racket {
  /** The action's name. */
  export const name: HumanActionName = "racket";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      racket: ["fromStrokeEnd", "quick"],
    });

  /** The positions. */
  export type Kind = "readyPosition" | "splitStep" | "golfAddress";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The position, the hand and the hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IParams {
    /** The position. */
    kind: Kind;

    /** The racket or lead hand; `right` when absent. */
    side?: "left" | "right";

    /** Seconds held; 0.6 when absent. */
    seconds?: number;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * Plan a racket or golf position.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation One phrase; each position's crouch, feet and hands on its envelope, the hop or the waggle on the stroke.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clock, shared rows, then one branch per position.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Body measures and named places; provisional values named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One balance solve per crouch and one posture solve per arm per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the crouch, the leg arc and the placed arm.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the clock and the stance.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const hold: number = p.seconds ?? 0.6;
    if (!(hold >= 0))
      throw new Error("A racket position's hold is not negative");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const side: "left" | "right" = p.side ?? "right";
    const other: "left" | "right" = side === "right" ? "left" : "right";
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: 0.6,
        attack: p.kind === "golfAddress" ? 1.2 : 0.3,
        hold,
        retract: 0.6,
      }),
      modifiers,
      {
        holds: ["strokeEnd"],
        fixed: p.kind === "splitStep" ? ["strokeStart"] : [],
      },
    );
    const entry: IHumanPosture = context.entry.posture;
    const into = (s: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], s);
    const local = (
      posture: IHumanPosture,
      v: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw }, v);
    const leftward: IAutoMovieVector3 = local(entry, { x: 1, y: 0, z: 0 });
    const arm: number = m.upperArm + m.forearm;
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    let contacts: IHumanContactWindow[] = AutoMovieMotionHumanBase.plants();
    const grip = (
      hand: "left" | "right",
      place: (posture: IHumanPosture, s: number) => IAutoMovieVector3,
      bend: "front" | "forward",
    ): IAutoMovieMotionHumanPrimitive[] =>
      AutoMovieMotionHumanPlaced.arm({
        body,
        side: hand,
        from: 0,
        to: clock.duration,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, hand),
        weight: into,
        surface: "grip",
        shape: "fist",
        place: (posture: IHumanPosture, s: number) => ({
          point: place(posture, s),
          facing: local(posture, { x: hand === "left" ? 1 : -1, y: 0, z: 0 }),
          forward: local(posture, { x: 0, y: 0, z: 1 }),
        }),
        bend,
      });

    if (p.kind === "readyPosition" || p.kind === "splitStep") {
      const apart: number = Vector3.dot(
        Vector3.subtract(
          context.entry.feet.left.ankle,
          context.entry.feet.right.ankle,
        ),
        leftward,
      );
      const half: number = Math.max(0, (4 * m.shoulderHalfWidth - apart) / 2);
      const wider: number =
        p.kind === "splitStep" ? 0.5 * m.shoulderHalfWidth : 0;
      const hop = (s: number): number => {
        if (p.kind !== "splitStep") return 0;
        const u: number = clock.linear("strokeStart", "stroke", s);
        return u > 0 && u < 1 ? 4 * u * (1 - u) : 0;
      };
      const landed = (s: number): number =>
        clock.linear("strokeStart", "stroke", s);
      for (const foot of ["left", "right"] as const) {
        const from: HumanFoot.IPlacement = {
          ankle: context.entry.feet[foot].ankle,
          rotation: context.entry.feet[foot].rotation,
        };
        const out = (by: number): HumanFoot.IPlacement => ({
          ankle: Vector3.add(
            from.ankle,
            Vector3.scale(leftward, (foot === "left" ? 1 : -1) * by),
          ),
          rotation: from.rotation,
        });
        primitives.push(
          AutoMovieMotionHumanLeg.place({
            body,
            side: foot,
            from: 0,
            to: clock.duration,
            placement: (_: IHumanPosture, s: number): HumanFoot.IPlacement => {
              const placed: HumanFoot.IPlacement =
                AutoMovieMotionHumanLeg.between(
                  from,
                  out(half + wider * landed(s)),
                  into(s),
                );
              return {
                ...placed,
                ankle: {
                  ...placed.ankle,
                  y: placed.ankle.y + 0.03 * m.stature * hop(s),
                },
              };
            },
            planted: (s: number): boolean =>
              (into(s) <= 0 || into(s) >= 1) && hop(s) === 0,
          }),
        );
      }
      primitives.push(
        {
          channels: ["root"],
          from: 0,
          to: clock.duration,
          write: (posture: IHumanPosture, s: number): IHumanPosture => ({
            ...posture,
            root: {
              ...posture.root,
              y: posture.root.y + 0.03 * m.stature * hop(s) * modifiers.extent,
            },
          }),
        },
        {
          channels: ["trunk"],
          from: 0,
          to: clock.duration,
          write: (posture: IHumanPosture, s: number): IHumanPosture => ({
            ...posture,
            pitch: posture.pitch + 15 * into(s),
          }),
        },
        ...grip(
          side,
          (posture: IHumanPosture) =>
            AutoMovieMotionHumanPlaced.grid(body, posture, side, {
              height: "waist",
              lateral: "centre",
              distance: "mid",
            }),
          "front",
        ),
        ...grip(
          other,
          (posture: IHumanPosture) =>
            AutoMovieMotionHumanPlaced.grid(
              body,
              posture,
              side,
              { height: "waist", lateral: "centre", distance: "mid" },
              { forward: m.hand / arm },
            ),
          "front",
        ),
      );
      contacts = [];
    } else {
      primitives.push(
        AutoMovieMotionHumanTrunk.crouch({
          body,
          standing: entry,
          clock,
          rise: ["start", "ready"],
          fall: ["relax", "end"],
          depth: 0.02 * m.stature,
          pitch: 35 * modifiers.extent,
        }),
      );
      const waggle = (s: number): number =>
        0.05 *
        arm *
        AutoMovieMotionClock.wave(clock, ["strokeStart", "strokeEnd"], 2, s);
      for (const hand of ["left", "right"] as const)
        primitives.push(
          ...grip(
            hand,
            (posture: IHumanPosture, s: number) => {
              // Hanging below the shoulders: the midpoint of the shoulders dropped an arm.
              const bones = context.body.rest;
              const shoulder: IAutoMovieVector3 = HumanFrame.point(
                { origin: posture.root, yaw: posture.yaw },
                {
                  x: 0,
                  y:
                    (bones.get("leftUpperArm")!.y +
                      bones.get("rightUpperArm")!.y) /
                    2,
                  z: 0,
                },
              );
              const ahead: number =
                Math.sin((35 * Math.PI) / 180) *
                (m.shoulderHeight - m.hipHeight) *
                into(s);
              return Vector3.add(
                { x: shoulder.x, y: shoulder.y - arm * 0.9, z: shoulder.z },
                Vector3.add(
                  local(posture, { x: 0, y: 0, z: ahead + waggle(s) }),
                  local(posture, {
                    x: (hand === "left" ? 0.5 : -0.5) * m.hand * 0.3,
                    y: hand === side ? -m.hand * 0.4 : 0,
                    z: 0,
                  }),
                ),
              );
            },
            "forward",
          ),
        );
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, contacts),
      clock,
      primitives,
      contact: "stroke",
    });
  }
}
