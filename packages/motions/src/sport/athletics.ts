import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The sprint start's crouch into the set position and its hold until the
 * gun (#3250): the hands on the start line, the front foot and the rear
 * foot on their blocks.
 *
 * The set position follows Harland and Steele 1997: the front knee at about
 * 90 degrees, the rear knee at about 130 degrees, the hips moderately high.
 * Every place is derived from the body: the hands lie on the line a
 * shoulder width apart with the arms vertical, so the shoulders stand an
 * arm and half a hand above the floor; the hips stand level with the
 * shoulders (provisional, "moderately high") a trunk's length behind them;
 * each foot stands behind the hips at the distance the law of cosines gives
 * for its knee angle with the thigh and the shank, on the floor. Where a
 * knee angle cannot be met with the foot on the floor, the foot goes under
 * the hip and the verdict reports the angle.
 *
 * The crouch takes 1.5 s (provisional): the front foot steps back to its
 * block over the first half, the rear foot over the second, while the hips
 * travel and the trunk pitches down; the set is held, and the action ends
 * at the gun. Events: `onYourMarks` (the crouch's start), `set`, `gun`.
 *
 * Not drafted: the on-your-marks kneel with the rear knee down, the drive
 * out of the blocks (the run law's), hurdles, relays, jumps and throws (the
 * jump and throw laws' rows).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the posture with its source, how each place derives from the body, the timing, the events and what is not drafted.
 * @evidence contracts/development/design.md#principled-representation A law record composed of root, leg and arm rows over one phrase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the angles, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The knee angles are the source's; lengths are the body's.
 */
export namespace athletics {
  /** The action's name. */
  export const name: HumanActionName = "athletics";

  /** Cancel table: the gun releases the start into a run. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      run: ["fromRelax", "reflex"],
      stand: ["fromRelax", "smooth"],
    });

  /** The front knee's included angle in the set, degrees (Harland and Steele 1997). */
  export const FRONT: number = 90;

  /** The rear knee's included angle in the set, degrees (Harland and Steele 1997). */
  export const REAR: number = 130;

  /** The crouch's seconds (provisional). */
  export const CROUCH: number = 1.5;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The front foot and the time held.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No block spacing in metres: the knees decide it.
   */
  export interface IParams {
    /** The front foot; `left` when absent. */
    front?: "left" | "right";

    /** Seconds held in the set; 1.5 when absent. */
    seconds?: number;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * The set position's hips, pitch and feet for a body in front of a line.
   *
   * @param context The body.
   * @param entry The standing posture; the line is a hand's length ahead of its feet.
   * @param front The front foot.
   * @returns The hips' world point, the trunk's pitch, each ankle and the hand height.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the geometry and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Shoulders over the hands at the arm's height, hips level a trunk behind, each foot at the knee angle's hip-to-ankle distance on the floor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Lengths, then three points.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable knee angle puts the foot under the hip rather than off the floor.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function set(
    context: Pick<IHumanActionContext, "body">,
    entry: IHumanPosture,
    front: "left" | "right",
  ): {
    hips: IAutoMovieVector3;
    pitch: number;
    line: IAutoMovieVector3;
    ankles: Record<"left" | "right", IAutoMovieVector3>;
  } {
    const m = context.body.measure;
    const frame: HumanFrame.IFrame = {
      origin: { x: entry.root.x, y: 0, z: entry.root.z },
      yaw: entry.yaw,
    };
    const line: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 0,
      y: 0,
      z: m.footLength,
    });
    const shoulder: number = m.upperArm + m.forearm + m.hand / 2;
    const trunk: number = m.shoulderHeight - m.hipHeight;
    const hipsLocal: IAutoMovieVector3 = {
      x: 0,
      y: shoulder,
      z: m.footLength - trunk,
    };
    const hips: IAutoMovieVector3 = HumanFrame.point(frame, hipsLocal);
    const reach = (angle: number): number =>
      Math.sqrt(
        m.thigh * m.thigh +
          m.shank * m.shank -
          2 * m.thigh * m.shank * Math.cos((angle * Math.PI) / 180),
      );
    const ankle = (
      side: "left" | "right",
      angle: number,
    ): IAutoMovieVector3 => {
      const drop: number = shoulder - m.ankleHeight;
      const d: number = reach(angle);
      const back: number = d > drop ? Math.sqrt(d * d - drop * drop) : 0;
      const hip: IAutoMovieVector3 = context.body.rest.get(`${side}UpperLeg`)!;
      return HumanFrame.point(frame, {
        x: hip.x,
        y: m.ankleHeight,
        z: hipsLocal.z - back,
      });
    };
    const rear: "left" | "right" = front === "left" ? "right" : "left";
    return {
      hips,
      pitch: 90,
      line,
      ankles: {
        [front]: ankle(front, FRONT),
        [rear]: ankle(rear, REAR),
      } as Record<"left" | "right", IAutoMovieVector3>,
    };
  }

  /**
   * Plan a sprint start.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The set position solved once; the root, the feet and the hands carried into it on one phrase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Set, clock, root row, two leg rows, two arm rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every place is the body's; provisional times are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per arm per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the leg arc, the placed arm and the posture heading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the set position and the clock.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const hold: number = p.seconds ?? 1.5;
    if (!(hold >= 0)) throw new Error("A sprint start's hold is not negative");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const front: "left" | "right" = p.front ?? "left";
    const rear: "left" | "right" = front === "left" ? "right" : "left";
    const entry: IHumanPosture = context.entry.posture;
    const target = set(context, entry, front);
    const timed: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: CROUCH,
        attack: 0,
        hold,
        retract: 0.001,
      }),
      modifiers,
    );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      timed.duration,
      [
        ...timed.instants,
        { name: "onYourMarks", seconds: 0 },
        { name: "set", seconds: timed.at("ready") },
        { name: "gun", seconds: timed.at("relax") },
      ],
    );
    const into = (seconds: number): number =>
      clock.progress("start", "ready", seconds);
    const hipsRest: IAutoMovieVector3 = body.rest.get("hips")!;
    const standingHips: IAutoMovieVector3 = Vector3.add(
      entry.root,
      Quaternion.rotateVector(resolveHumanPosture.heading(entry), hipsRest),
    );
    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      {
        channels: ["root", "trunk"],
        from: 0,
        to: clock.duration,
        write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
          const w: number = into(seconds);
          const pitched: IHumanPosture = {
            ...posture,
            pitch: posture.pitch + target.pitch * w,
          };
          const hips: IAutoMovieVector3 = Vector3.lerp(
            standingHips,
            target.hips,
            w,
          );
          return {
            ...pitched,
            root: Vector3.subtract(
              hips,
              Quaternion.rotateVector(
                resolveHumanPosture.heading(pitched),
                hipsRest,
              ),
            ),
          };
        },
      },
    ];
    for (const [side, from, to] of [
      [front, "start", "half"],
      [rear, "half", "ready"],
    ] as const) {
      const stance: HumanFoot.IPlacement = {
        ankle: context.entry.feet[side].ankle,
        rotation: context.entry.feet[side].rotation,
      };
      const block: HumanFoot.IPlacement = {
        ankle: target.ankles[side],
        rotation: stance.rotation,
      };
      const share = (seconds: number): number => {
        const half: number = clock.at("ready") / 2;
        const a: number = from === "start" ? 0 : half;
        const b: number = to === "half" ? half : clock.at("ready");
        return Math.min(1, Math.max(0, (seconds - a) / (b - a)));
      };
      primitives.push(
        AutoMovieMotionHumanLeg.place({
          body,
          side,
          from: 0,
          to: clock.duration,
          placement: (
            _: IHumanPosture,
            seconds: number,
          ): HumanFoot.IPlacement =>
            AutoMovieMotionHumanLeg.arc(
              stance,
              block,
              0.05 * body.measure.stature,
              share(seconds),
            ),
          planted: (seconds: number): boolean =>
            share(seconds) <= 0 || share(seconds) >= 1,
        }),
      );
    }
    for (const side of ["left", "right"] as const)
      primitives.push(
        ...AutoMovieMotionHumanPlaced.arm({
          body,
          side,
          from: 0,
          to: clock.duration,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          weight: into,
          place: (posture: IHumanPosture) => ({
            point: HumanFrame.point(
              { origin: target.line, yaw: posture.yaw },
              {
                x: (side === "left" ? 1 : -1) * body.measure.shoulderHalfWidth,
                y: 0,
                z: -body.measure.hand / 2,
              },
            ),
            facing: { x: 0, y: -1, z: 0 },
            forward: HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
              { x: 0, y: 0, z: 1 },
            ),
          }),
          bend: "front",
        }),
      );
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, [
        {
          part: "leftFoot",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "leftHand",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "rightHand",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: 1,
          support: { kind: "ground" },
        },
      ]),
      clock,
      primitives,
      contact: "set",
    });
  }
}
