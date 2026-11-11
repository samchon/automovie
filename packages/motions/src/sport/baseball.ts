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
import { exercise } from "../exercise/exercise";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Baseball and softball positions without the bat's swing or the pitch
 * (#3248): the catcher's crouch, fielding a ground ball, and the batting
 * stance with its load. The glove hand is the left; no glove or bat is held.
 *
 * - Catcher's crouch: the hips sink to a half squat
 *   (`exercise.drop`, provisional for a catcher) with the trunk pitched 20
 *   degrees, the glove presented palm forward at chest height mid-reach, the
 *   throwing fist behind the right knee.
 * - Ground ball: a half squat with the trunk pitched 45 degrees, the glove
 *   palm forward and up on the floor a forearm ahead, the throwing hand
 *   above it to cover the ball (provisional places).
 * - Batting stance: the left foot steps out to two shoulder widths, the
 *   knees give 3 % of the stature, both fists stacked on the implied bat's
 *   handle at the right shoulder; the load at the stroke draws the hands a
 *   tenth of the arm back (provisional; the load precedes the stride,
 *   Welch et al. 1995).
 *
 * Each is a phrase: into the position in 0.8 s, held, and back to standing
 * in 0.8 s (provisional).
 *
 * Not drafted: the swing, the bunt and the check swing (the implement
 * strike owner's, #3244, whose file does not exist yet), the pitch (a row
 * of the throw law), the windmill pitch, the catcher's throw and base
 * running slides.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each position's geometry, timing, sources and provisional values, and the gaps with their owners.
 * @evidence contracts/development/design.md#principled-representation A law record of crouch, leg and placed-arm rows over one phrase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the kinds, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the squat's depth rule; places are named grid places.
 */
export namespace baseball {
  /** The action's name. */
  export const name: HumanActionName = "baseball";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      throwObject: ["fromRelax", "quick"],
      run: ["fromRelax", "quick"],
    });

  /** The positions. */
  export type Kind = "catcherCrouch" | "groundBall" | "battingStance";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The position and the hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IParams {
    /** The position. */
    kind: Kind;

    /** Seconds held; 1 when absent. */
    seconds?: number;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * Plan a baseball position.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation One phrase; each position's crouch, step and arm places on its envelope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clock, then one branch per position.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Body measures and named places; provisional values named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One balance solve per crouch and one posture solve per arm per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the squat's drop, the crouch, the leg arc and the placed arm.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the clock and the stance.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const hold: number = p.seconds ?? 1;
    if (!(hold >= 0))
      throw new Error("A baseball position's hold is not negative");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: 0.8,
        attack: 0.3,
        hold,
        retract: 0.8,
      }),
      modifiers,
    );
    const entry: IHumanPosture = context.entry.posture;
    const into = (s: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], s);
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
        fall: ["relax", "end"],
        depth: depth * modifiers.extent,
        pitch,
      });
    const placed = (
      side: "left" | "right",
      place: (
        posture: IHumanPosture,
        s: number,
      ) => {
        point: IAutoMovieVector3;
        facing: IAutoMovieVector3;
        forward?: IAutoMovieVector3;
      },
      shape: "flat" | "fist",
      bend: "forward" | "tucked" | "folded" | "front",
    ): IAutoMovieMotionHumanPrimitive[] =>
      AutoMovieMotionHumanPlaced.arm({
        body,
        side,
        from: 0,
        to: clock.duration,
        rest: rest(side),
        weight: into,
        place,
        surface: shape === "fist" ? "grip" : "palm",
        shape,
        bend,
      });
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    let contacts: IHumanContactWindow[] = AutoMovieMotionHumanBase.plants();

    switch (p.kind) {
      case "catcherCrouch":
        primitives.push(
          crouch(exercise.drop(m, "half"), 20),
          ...placed(
            "left",
            (posture: IHumanPosture) => ({
              point: AutoMovieMotionHumanPlaced.grid(body, posture, "left", {
                height: "chest",
                lateral: "centre",
                distance: "mid",
              }),
              facing: local(posture, { x: 0, y: 0, z: 1 }),
              forward: { x: 0, y: 1, z: 0 },
            }),
            "flat",
            "forward",
          ),
          ...placed(
            "right",
            (posture: IHumanPosture) => ({
              point: AutoMovieMotionHumanPlaced.grid(
                body,
                posture,
                "right",
                { height: "knee", lateral: "outside", distance: "close" },
                { forward: -0.2 },
              ),
              facing: local(posture, { x: 0, y: 0, z: -1 }),
            }),
            "fist",
            "tucked",
          ),
        );
        break;
      case "groundBall":
        primitives.push(
          crouch(exercise.drop(m, "half"), 45),
          ...placed(
            "left",
            (posture: IHumanPosture) => ({
              point: AutoMovieMotionHumanPlaced.grid(
                body,
                posture,
                "left",
                { height: "floor", lateral: "centre", distance: "mid" },
                { up: 0.05 },
              ),
              facing: Vector3.normalize(
                Vector3.add(local(posture, { x: 0, y: 0, z: 1 }), {
                  x: 0,
                  y: 1,
                  z: 0,
                }),
              ),
            }),
            "flat",
            "forward",
          ),
          ...placed(
            "right",
            (posture: IHumanPosture) => ({
              point: AutoMovieMotionHumanPlaced.grid(
                body,
                posture,
                "right",
                { height: "floor", lateral: "centre", distance: "mid" },
                { up: 0.25 },
              ),
              facing: { x: 0, y: -1, z: 0 },
            }),
            "flat",
            "forward",
          ),
        );
        break;
      case "battingStance": {
        const leftward: IAutoMovieVector3 = local(entry, { x: 1, y: 0, z: 0 });
        const apart: number = Vector3.dot(
          Vector3.subtract(
            context.entry.feet.left.ankle,
            context.entry.feet.right.ankle,
          ),
          leftward,
        );
        const out: number = Math.max(0, 4 * m.shoulderHalfWidth - apart);
        const from: HumanFoot.IPlacement = {
          ankle: context.entry.feet.left.ankle,
          rotation: context.entry.feet.left.rotation,
        };
        primitives.push(
          crouch(0.03 * m.stature, 10),
          AutoMovieMotionHumanLeg.place({
            body,
            side: "left",
            from: 0,
            to: clock.duration,
            placement: (_: IHumanPosture, s: number): HumanFoot.IPlacement =>
              AutoMovieMotionHumanLeg.arc(
                from,
                {
                  ankle: Vector3.add(from.ankle, Vector3.scale(leftward, out)),
                  rotation: from.rotation,
                },
                0.03 * m.stature,
                into(s),
              ),
            planted: (s: number): boolean => into(s) <= 0 || into(s) >= 1,
          }),
        );
        for (const side of ["left", "right"] as const)
          primitives.push(
            ...placed(
              side,
              (posture: IHumanPosture, s: number) => {
                const handle: IAutoMovieVector3 =
                  AutoMovieMotionHumanPlaced.grid(
                    body,
                    posture,
                    "right",
                    {
                      height: "shoulder",
                      lateral: "shoulder",
                      distance: "close",
                    },
                    {
                      forward:
                        -0.1 * clock.progress("strokeStart", "stroke", s),
                    },
                  );
                return {
                  point: {
                    ...handle,
                    y: handle.y - (side === "left" ? m.hand / 2 : 0),
                  },
                  facing: local(posture, {
                    x: side === "left" ? 1 : -1,
                    y: 0,
                    z: 0,
                  }),
                  forward: { x: 0, y: 1, z: 0 },
                };
              },
              "fist",
              "folded",
            ),
          );
        contacts = [
          {
            part: "rightFoot",
            kind: "plant",
            from: 0,
            to: 1,
            support: { kind: "ground" },
          },
        ];
        break;
      }
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, contacts),
      clock,
      primitives,
      contact: "stroke",
    });
  }
}
