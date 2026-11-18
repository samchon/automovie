import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRacket,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanLegPhrase } from "../compose/AutoMovieMotionHumanLegPhrase";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanFrame } from "../posture/HumanFrame";

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
 *   `HANG` of the arm below the shoulders, and the waggle moves them a
 *   twentieth of the arm forward and back twice.
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
  export const name: AutoMovieMotionHumanActionName = "racket";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      racket: ["fromStrokeEnd", "quick"],
    });

  /** How far below the shoulders the golfer's upper hand grips, arm lengths (provisional): the elbows a little soft. */
  export const HANG: number = 0.8;

  /**
   * Plan a racket or golf position.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation One phrase; each position's crouch, feet and hands on its envelope, the hop or the waggle on the stroke.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clock, shared rows, then one branch per position.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Body measures and named places; provisional values named.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each hand supplies the actual phrase span to the existing arm trajectory planner, preparing reach/hold/return work once; the original crouch, footwork and active-time goals remain with their shared primitives.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the crouch, leg arc and placed arm's existing span-driven planner rather than re-entering deprecated share-only arm clearance on every displayed second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the clock and the stance.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRacket.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanRacket.IParams = context.params;
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const m: IAutoMovieMotionHumanActionContext["body"]["measure"] = body.measure;
    const hold: number = p.seconds ?? 0.6;
    HumanBound.least("seconds", hold, 0, "s");
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const side: "left" | "right" = p.side ?? "right";
    const other: "left" | "right" = side === "right" ? "left" : "right";
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
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
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const into: (s: number) => number = (s: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], s);
    const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
      start: clock.at("start"),
      ready: clock.at("ready"),
      relax: clock.at("relax"),
      end: clock.at("end"),
    };
    const local: (
      posture: IAutoMovieMotionHumanPosture,
      v: IAutoMovieVector3,
    ) => IAutoMovieVector3 = (
      posture: IAutoMovieMotionHumanPosture,
      v: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw }, v);
    const leftward: IAutoMovieVector3 = local(entry, { x: 1, y: 0, z: 0 });
    const arm: number = m.upperArm + m.forearm;
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    let contacts: IAutoMovieMotionHumanContactWindow[] = AutoMovieMotionHumanBase.plants();
    const grip: (
      hand: "left" | "right",
      place: (posture: IAutoMovieMotionHumanPosture, s: number) => IAutoMovieVector3,
      bend: "front" | "forward",
    ) => IAutoMovieMotionHumanPrimitive[] = (
      hand: "left" | "right",
      place: (posture: IAutoMovieMotionHumanPosture, s: number) => IAutoMovieVector3,
      bend: "front" | "forward",
    ): IAutoMovieMotionHumanPrimitive[] =>
      AutoMovieMotionHumanPlaced.arm({
        body,
        side: hand,
        from: 0,
        to: clock.duration,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, hand),
        weight: into,
        span,
        surface: "grip",
        shape: "fist",
        place: (posture: IAutoMovieMotionHumanPosture, s: number) => ({
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
      // The hop's rise, metres: the root and both feet leave the floor by
      // the same height, so the legs keep their length through the hop.
      const height: number = 0.03 * m.stature * modifiers.extent;
      const hop: (s: number) => number = (s: number): number => {
        if (p.kind !== "splitStep") return 0;
        const u: number = clock.linear("strokeStart", "stroke", s);
        return u > 0 && u < 1 ? height * 4 * u * (1 - u) : 0;
      };
      const landed: (s: number) => number = (s: number): number =>
        clock.linear("strokeStart", "stroke", s);
      for (const foot of ["left", "right"] as const) {
        const from: IAutoMovieMotionHumanFoot.IPlacement = {
          ankle: context.entry.feet[foot].ankle,
          rotation: context.entry.feet[foot].rotation,
        };
        const out: (by: number) => IAutoMovieMotionHumanFoot.IPlacement = (by: number): IAutoMovieMotionHumanFoot.IPlacement => ({
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
            placement: (_: IAutoMovieMotionHumanPosture, s: number): IAutoMovieMotionHumanFoot.IPlacement => {
              const placed: IAutoMovieMotionHumanFoot.IPlacement =
                AutoMovieMotionHumanLegPhrase.between(
                  from,
                  out(half + wider * landed(s)),
                  into(s),
                );
              return {
                ...placed,
                ankle: {
                  ...placed.ankle,
                  y: placed.ankle.y + hop(s),
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
          write: (posture: IAutoMovieMotionHumanPosture, s: number): IAutoMovieMotionHumanPosture => ({
            ...posture,
            root: {
              ...posture.root,
              y: posture.root.y + hop(s),
            },
          }),
        },
        {
          channels: ["trunk"],
          from: 0,
          to: clock.duration,
          write: (posture: IAutoMovieMotionHumanPosture, s: number): IAutoMovieMotionHumanPosture => ({
            ...posture,
            pitch: posture.pitch + 15 * into(s),
          }),
        },
        ...grip(
          side,
          (posture: IAutoMovieMotionHumanPosture) =>
            AutoMovieMotionHumanPlaced.grid(body, posture, side, {
              height: "waist",
              lateral: "centre",
              distance: "mid",
            }),
          "front",
        ),
        ...grip(
          other,
          // A hand's length ahead of the racket hand along the heading, on the racket's throat.
          (posture: IAutoMovieMotionHumanPosture) =>
            Vector3.add(
              AutoMovieMotionHumanPlaced.grid(body, posture, side, {
                height: "waist",
                lateral: "centre",
                distance: "mid",
              }),
              local(posture, { x: 0, y: 0, z: m.hand }),
            ),
          "front",
        ),
      );
      // Each foot bears where it is planted: from the step out to the step
      // back, the split step's hop excepted.
      const share: (instant: string) => number = (instant: string): number =>
        clock.at(instant) / clock.duration;
      const bearing: [number, number][] =
        p.kind === "splitStep"
          ? [
              [share("ready"), share("strokeStart")],
              [share("stroke"), share("relax")],
            ]
          : [[share("ready"), share("relax")]];
      contacts = bearing
        .filter(([from, to]: [number, number]): boolean => to > from)
        .flatMap(
          ([from, to]: [number, number]): IAutoMovieMotionHumanContactWindow[] =>
            AutoMovieMotionHumanBase.plants(from, to),
        );
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
      const waggle: (s: number) => number = (s: number): number =>
        0.05 *
        arm *
        AutoMovieMotionClock.wave(clock, ["strokeStart", "strokeEnd"], 2, s);
      for (const hand of ["left", "right"] as const)
        primitives.push(
          ...grip(
            hand,
            (posture: IAutoMovieMotionHumanPosture, s: number) => {
              // Hanging below the shoulders: their midpoint dropped by `HANG` of the arm, which leaves the lower hand's wrist inside the arm's reach through the waggle.
              const shoulder: IAutoMovieVector3 =
                AutoMovieMotionHumanPlaced.shoulders(body, posture);
              return Vector3.add(
                { x: shoulder.x, y: shoulder.y - arm * HANG, z: shoulder.z },
                Vector3.add(
                  local(posture, { x: 0, y: 0, z: waggle(s) }),
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
