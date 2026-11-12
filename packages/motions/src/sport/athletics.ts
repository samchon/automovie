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
import { HumanBound } from "../law/HumanBound";
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
 * shoulder width apart with the arms vertical, so the shoulders stand the
 * arms' reach above the wrists of the laid hands; the hips stand level with
 * the shoulders (provisional, "moderately high") a trunk's length behind
 * them; each foot rests on its block's face, the ball on the floor and the
 * heel raised, behind the hips at the distance the law of cosines gives for
 * its knee angle with the thigh and the shank. Where a knee angle cannot be
 * met, the foot goes under the hip and the verdict reports the angle.
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

  /** The front block's face from the floor, degrees (provisional, within a competition block's adjustment). */
  export const FRONT_BLOCK: number = 50;

  /** The rear block's face from the floor, degrees (provisional, within a competition block's adjustment). */
  export const REAR_BLOCK: number = 65;

  /** The share of the straight arm's length the shoulders stand above the wrists (provisional): the elbows a little soft. */
  export const REACH: number = 0.98;

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
   * @returns The hips' world point, the trunk's pitch, each palm's place on the floor and each foot's placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the geometry and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The shoulders over the wrists of the laid hands at the arms' reach, the trunk pitched until the hips stand level with them, each foot on its block's face at the knee angle's hip-to-ankle distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The palms, the shoulders, the hips, then one foot per knee angle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable knee angle puts the foot under the hip rather than off the floor; the wrist's height is the hand owner's, never half a hand.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the placed arm's wrist, pitch and root, and the foot's pivot.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function set(
    context: Pick<IHumanActionContext, "body">,
    entry: IHumanPosture,
    front: "left" | "right",
  ): {
    hips: IAutoMovieVector3;
    pitch: number;
    palms: Record<
      "left" | "right",
      {
        point: IAutoMovieVector3;
        facing: IAutoMovieVector3;
        forward: IAutoMovieVector3;
      }
    >;
    feet: Record<"left" | "right", HumanFoot.IPlacement>;
  } {
    const body = context.body;
    const m = body.measure;
    const frame: HumanFrame.IFrame = {
      origin: { x: entry.root.x, y: 0, z: entry.root.z },
      yaw: entry.yaw,
    };
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const palm = (side: "left" | "right") => ({
      point: HumanFrame.point(frame, {
        x: (side === "left" ? 1 : -1) * m.shoulderHalfWidth,
        y: 0,
        z: m.footLength - m.hand / 2,
      }),
      facing: { x: 0, y: -1, z: 0 },
      forward,
    });
    const palms = { left: palm("left"), right: palm("right") };
    // The shoulders stand over the wrists of the laid hands, the arms' reach above them.
    const wrists: IAutoMovieVector3 = Vector3.lerp(
      AutoMovieMotionHumanPlaced.wrist(body, "left", palms.left),
      AutoMovieMotionHumanPlaced.wrist(body, "right", palms.right),
      0.5,
    );
    const shoulders: IAutoMovieVector3 = {
      ...wrists,
      y: wrists.y + REACH * (m.upperArm + m.forearm),
    };
    const turn = {
      yaw: entry.yaw,
      pitch: AutoMovieMotionHumanPlaced.pitch(body, 0),
      roll: 0,
    };
    const hips: IAutoMovieVector3 = Vector3.add(
      AutoMovieMotionHumanPlaced.root(
        turn,
        AutoMovieMotionHumanPlaced.girdle(body),
        shoulders,
      ),
      Quaternion.rotateVector(
        resolveHumanPosture.heading(turn),
        body.rest.get("hips")!,
      ),
    );
    const behind: number = HumanFrame.local(frame, hips).z;
    const foot = (
      side: "left" | "right",
      knee: number,
      block: number,
    ): HumanFoot.IPlacement => {
      const rotation = HumanFoot.rotation(entry.yaw, -block);
      // The ankle's height with the ball on the floor and the sole on the block's face.
      const raised: number = HumanFoot.pivot(
        body,
        side,
        "ball",
        { x: 0, y: 0, z: 0 },
        entry.yaw,
        -block,
      ).ankle.y;
      const drop: number = hips.y - raised;
      const d: number = Math.sqrt(
        m.thigh * m.thigh +
          m.shank * m.shank -
          2 * m.thigh * m.shank * Math.cos((knee * Math.PI) / 180),
      );
      return {
        ankle: HumanFrame.point(frame, {
          x: body.rest.get(`${side}UpperLeg`)!.x,
          y: raised,
          z: behind - (d > drop ? Math.sqrt(d * d - drop * drop) : 0),
        }),
        rotation,
      };
    };
    const rear: "left" | "right" = front === "left" ? "right" : "left";
    return {
      hips,
      pitch: turn.pitch,
      palms,
      feet: {
        [front]: foot(front, FRONT, FRONT_BLOCK),
        [rear]: foot(rear, REAR, REAR_BLOCK),
      } as Record<"left" | "right", HumanFoot.IPlacement>,
    };
  }

  /**
   * Plan a sprint start.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
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
    HumanBound.least("seconds", hold, 0, "s");
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
      const block: HumanFoot.IPlacement = target.feet[side];
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
          place: () => target.palms[side],
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
