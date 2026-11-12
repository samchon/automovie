import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Team ball skills performed with an implied ball (#3247): the stationary
 * basketball dribble, the volleyball forearm pass (dig) and overhead pass
 * (set), and the football throw-in. No ball is held or struck; the hands
 * move where the ball would make them.
 *
 * - Dribble: the knees give a twentieth of the stature (provisional), the
 *   palm faces down at the hand's side ahead of the hip, pushes down a
 *   quarter of the arm and rises again `count` times at 2 bounces a second
 *   (provisional).
 * - Dig: in a crouch, both arms reach from the displayed shoulders, nearly
 *   straight, to a platform pointing 40 degrees below the horizontal, the
 *   palms together; the platform lifts 10 degrees at the contact.
 * - Set: in a crouch, both hands stand above the forehead, palms up and
 *   forward; at the contact the legs extend and the hands rise overhead.
 * - Throw-in: both feet stay on the ground (the Laws of the Game), both
 *   hands are drawn behind the head while the trunk arches back about the
 *   hips, and they come over the head and forward as the trunk flexes, along
 *   a line rising at 30 degrees, the distance-best release angle (Linthorne
 *   and Everett 2006), to where it meets the arms' reach about the flexed
 *   shoulders.
 *
 * Every skill is a phrase: `ready` in the skill's set position after 0.5 s
 * (provisional), the stroke, and back to standing in 0.5 s.
 *
 * Not drafted: shots, passes, layups, rebounds, the spike, the block, the
 * serve, ball kicks, headers and the goalkeeper (they need the throw and the
 * ball-strike owners, #3232 and #3244, and the jump law).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each skill's geometry, timing and sources, the provisional values and what is not drafted.
 * @evidence contracts/development/design.md#principled-representation A law record of crouch, lean and placed-arm rows over one phrase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the kinds, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Places are named grid places and shares of the body.
 */
export namespace ballSport {
  /** The action's name. */
  export const name: HumanActionName = "ballSport";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      ballSport: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /** The skills. */
  export type Kind = "dribble" | "dig" | "set" | "throwIn";

  /** Dribble bounces per second (provisional). */
  export const BOUNCES: number = 2;

  /** How far behind the head's joint the throw-in's hands are drawn, arm lengths (provisional). */
  export const BEHIND: number = 0.15;

  /** The throw-in's backward arch of the trunk about the hips at `ready`, degrees (provisional). */
  export const ARCH: number = 10;

  /** The throw-in's forward flexion of the trunk about the hips at the release, degrees (provisional). */
  export const FLEX: number = 15;

  /** The rise of the throw-in's hand path, degrees: the distance-best release angle (Linthorne and Everett 2006). */
  export const RELEASE: number = 30;

  /** A football's radius, metres (size 5, 68 to 70 cm around, the Laws of the Game). */
  export const BALL: number = 0.11;

  /** How far below the horizontal the dig's platform points before the contact, degrees (provisional). */
  export const PLATFORM: number = 40;

  /** How far the dig's platform lifts at the contact, degrees (provisional). */
  export const LIFT: number = 10;

  /** The share of the arm's length the hands of a dig or a throw-in's release reach from the shoulders (provisional). */
  export const REACH: number = 0.9;

  /** The set position's entry and the return, seconds (provisional). */
  export const READY: number = 0.5;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The skill, the hand and the bounce count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IParams {
    /** The skill. */
    kind: Kind;

    /** The dribbling hand; `right` when absent. */
    side?: "left" | "right";

    /** Dribble bounces; 4 when absent. */
    count?: number;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * Plan a ball skill.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the count is not a positive whole number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation One phrase; each skill's crouch, lean and arm places on its envelope and its stroke.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clock, then one branch per skill.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Body measures and named places; provisional values named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per arm per second and one balance solve per crouch.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the crouch, the placed arm and the hand's pad.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the clock.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const count: number = p.count ?? 4;
    HumanBound.whole("count", count);
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const attack: number =
      p.kind === "dribble"
        ? count / BOUNCES
        : p.kind === "throwIn"
          ? 0.35
          : 0.25;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: p.kind === "throwIn" ? 0.7 : READY,
        attack,
        follow: 0.2,
        hold: 0.2,
        retract: READY,
      }),
      modifiers,
    );
    const entry: IHumanPosture = context.entry.posture;
    const into = (s: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], s);
    const stroke = (s: number): number =>
      clock.progress("strokeStart", "stroke", s);
    const arm: number = m.upperArm + m.forearm;
    const local = (
      posture: IHumanPosture,
      v: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw }, v);
    const rest = (side: "left" | "right"): AutoMovieMotionHumanArm.IAngles =>
      AutoMovieMotionHumanArm.angles(context.entry.pose, side);
    const crouch = (
      depth: number,
      pitch: number,
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanTrunk.crouch({
        body,
        standing: entry,
        clock,
        rise: ["start", "ready"],
        fall: [
          p.kind === "set" ? "strokeStart" : "relax",
          p.kind === "set" ? "stroke" : "end",
        ],
        depth: depth * m.stature * modifiers.extent,
        pitch,
      });
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    const pad: number = AutoMovieMotionHumanTouchEffector.pad(body, "right", {
      surface: "palm",
      shape: "flat",
    });

    switch (p.kind) {
      case "dribble": {
        const side: "left" | "right" = p.side ?? "right";
        primitives.push(
          crouch(0.05, 15),
          ...AutoMovieMotionHumanPlaced.arm({
            body,
            side,
            from: 0,
            to: clock.duration,
            rest: rest(side),
            weight: into,
            place: (posture: IHumanPosture, s: number) => {
              const u: number = clock.linear("strokeStart", "strokeEnd", s);
              const down: number =
                0.25 *
                arm *
                modifiers.extent *
                Math.sin(Math.PI * count * u) ** 2;
              const at: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.grid(
                body,
                posture,
                side,
                {
                  height: "waist",
                  lateral: "outside",
                  distance: "near",
                },
              );
              return {
                point: { ...at, y: at.y - down },
                facing: { x: 0, y: -1, z: 0 },
              };
            },
          }),
        );
        break;
      }
      case "dig":
        primitives.push(crouch(0.08, 25));
        for (const side of ["left", "right"] as const)
          primitives.push(
            ...AutoMovieMotionHumanPlaced.arm({
              body,
              side,
              from: 0,
              to: clock.duration,
              rest: rest(side),
              weight: into,
              place: (posture: IHumanPosture, s: number) => {
                // The platform: nearly straight arms from the displayed shoulders, lifted at the contact.
                const below: number =
                  ((PLATFORM - LIFT * stroke(s)) * Math.PI) / 180;
                const along: IAutoMovieVector3 = local(posture, {
                  x: 0,
                  y: -Math.sin(below),
                  z: Math.cos(below),
                });
                return {
                  point: Vector3.add(
                    Vector3.add(
                      AutoMovieMotionHumanPlaced.shoulders(body, posture),
                      Vector3.scale(along, REACH * arm),
                    ),
                    local(posture, {
                      x: (side === "left" ? 1 : -1) * pad,
                      y: 0,
                      z: 0,
                    }),
                  ),
                  facing: local(posture, {
                    x: side === "left" ? -1 : 1,
                    y: 0,
                    z: 0,
                  }),
                  forward: along,
                };
              },
              bend: "forward",
            }),
          );
        break;
      case "set":
        primitives.push(crouch(0.05, 5));
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
                    height: "crown",
                    lateral: "inside",
                    distance: "close",
                  }),
                  AutoMovieMotionHumanPlaced.grid(body, posture, side, {
                    height: "overhead",
                    lateral: "inside",
                    distance: "close",
                  }),
                  stroke(s),
                ),
                facing: { x: 0, y: 1, z: 0 },
                forward: local(posture, { x: 0, y: 0, z: 1 }),
              }),
              bend: "raised",
            }),
          );
        break;
      case "throwIn": {
        primitives.push(
          AutoMovieMotionHumanLean.sway({
            body,
            from: 0,
            to: clock.duration,
            angles: (s: number) => ({
              pitch: into(s) * (-ARCH + (ARCH + FLEX) * stroke(s)),
              roll: 0,
            }),
          }),
        );
        const heading: IAutoMovieVector3 = local(entry, { x: 0, y: 0, z: 1 });
        const tilted = (pitch: number): IHumanPosture =>
          AutoMovieMotionHumanLean.pivot(body, entry, { pitch, roll: 0 });
        // Behind the head as the arched trunk carries it, at the head's middle.
        const drawn: IAutoMovieVector3 = Vector3.add(
          AutoMovieMotionHumanPlaced.joint(body, tilted(-ARCH), "head"),
          Vector3.add(Vector3.scale(heading, -BEHIND * arm), {
            x: 0,
            y: m.headRadius,
            z: 0,
          }),
        );
        // The release lies where the line rising at RELEASE from there meets the arms' reach about the flexed shoulders.
        const rise: number = (RELEASE * Math.PI) / 180;
        const line: IAutoMovieVector3 = Vector3.add(
          Vector3.scale(heading, Math.cos(rise)),
          { x: 0, y: Math.sin(rise), z: 0 },
        );
        const from: IAutoMovieVector3 = Vector3.subtract(
          drawn,
          AutoMovieMotionHumanPlaced.shoulders(body, tilted(FLEX)),
        );
        const b: number = Vector3.dot(from, line);
        const travel: number =
          -b +
          Math.sqrt(
            Math.max(0, b * b - Vector3.dot(from, from) + (REACH * arm) ** 2),
          );
        const released: IAutoMovieVector3 = Vector3.add(
          drawn,
          Vector3.scale(line, travel),
        );
        for (const side of ["left", "right"] as const) {
          const beside: IAutoMovieVector3 = local(entry, {
            x: (side === "left" ? 1 : -1) * BALL,
            y: 0,
            z: 0,
          });
          primitives.push(
            ...AutoMovieMotionHumanPlaced.arm({
              body,
              side,
              from: 0,
              to: clock.duration,
              rest: rest(side),
              weight: into,
              place: (_posture: IHumanPosture, s: number) => ({
                point: Vector3.add(
                  Vector3.lerp(drawn, released, stroke(s)),
                  beside,
                ),
                facing: local(entry, {
                  x: side === "left" ? -1 : 1,
                  y: 0,
                  z: 0,
                }),
                forward: { x: 0, y: 1, z: 0 },
              }),
              bend: "raised",
            }),
          );
        }
        break;
      }
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(
        clock.duration,
        entry,
        AutoMovieMotionHumanBase.plants(),
      ),
      clock,
      primitives,
      contact: "stroke",
    });
  }
}
