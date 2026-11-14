import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Climbing a vertical fixed ladder from the floor before it, in the
 * four-beat ipsilateral pattern: right hand, right foot, left hand, left
 * foot, one limb moving at a time, so three limbs always hold the ladder
 * (Jensen and Holland 2020, Int J Environ Res Public Health 17:2897).
 *
 * The goals are rungs. The ladder stands `start` metres ahead of the toes,
 * its rungs `spacing` apart from the floor up (OSHA 1910.23(b)(2): 25 to 36
 * cm, the default 0.3 m); a spacing outside that band, or one the body's leg
 * cannot step, is refused. Each foot stands with its ball on a rung's top,
 * and each hand grips a rung (Jensen and Holland found rungs used in 59 of
 * 80 tasks) at the rung nearest the shoulder's height above the feet. First
 * both hands reach their rungs, then every beat moves one limb up one rung:
 * a foot on a minimum-jerk arc that clears the rung below by `CLEARANCE`, a
 * hand on a minimum-jerk path. The pelvis stays `BACK` leg lengths behind
 * the rungs and rises with the feet, lowered wherever a planted leg could
 * not reach. Each beat takes `BEAT` seconds (provisional), scaled by the
 * manner's tempo. Events: `handsOn`, then per beat `<limb>Release<n>` and
 * `<limb>Contact<n>`, the limb one of `rightHand`, `rightFoot`, `leftHand`,
 * `leftFoot`.
 *
 * Not yet: the two-beat patterns, rail grips, climbing down, the top-out,
 * and hanging, traversing, mantling and vaulting (the rest of #3238); the
 * A8 `bar` and `ledge` kinds the core owns.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pattern with its source, the ladder's geometry and band, the holds, the timing, the events and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record of one whole-body row over a beat schedule on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the constants, the rung geometry and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ladder is the author's architecture; every hold follows from it and the body's measure.
 */
export namespace climbLadder {
  /** The action's name. */
  export const name: HumanActionName = "climbLadder";

  /** Cancel table: none yet; the climber holds the ladder at the end. */
  export const interrupts: IHumanActionLaw["interrupts"] = {};

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and default.
   * @evidence contracts/development/design.md#principled-representation The ladder's spacing and place, and how far to climb.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hold is typed.
   */
  export interface IParams {
    /** How many rungs the feet climb; 3 when absent. */
    rungs?: number & tags.Type<"uint32"> & tags.Minimum<1> & HumanUnit<"">;

    /** Rung spacing, metres, from 0.25 to 0.36; 0.3 when absent. */
    spacing?: number & tags.Minimum<0.25> & tags.Maximum<0.36> & HumanUnit<"m">;

    /** The rungs' distance ahead of the toes, metres; 0.15 when absent. */
    start?: number;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** One beat's seconds (provisional). */
  export const BEAT: number = 0.8;

  /** How far a swinging foot clears its path's straight line, metres (provisional). */
  export const CLEARANCE: number = 0.06;

  /** How far the hip joints stay behind the rungs, in leg lengths (provisional). */
  export const BACK: number = 0.35;

  /** A rung's radius, metres (provisional). */
  export const RUNG: number = 0.015;

  /** The beat order of the four-beat ipsilateral pattern. */
  export const ORDER: readonly Limb[] = [
    "rightHand",
    "rightFoot",
    "leftHand",
    "leftFoot",
  ];

  /** A limb of the climb. */
  export type Limb = "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

  /**
   * A ladder as the plan resolved it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The rungs' plane and spacing in the starting floor frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `rung` and the capture.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain numbers.
   */
  export interface ILadder {
    /** The floor frame at the start: origin under the feet's middle, the heading. */
    frame: HumanFrame.IFrame;

    /** The rungs' distance ahead in that frame, metres. */
    ahead: number;

    /** The rung spacing, metres. */
    spacing: number;
  }

  /**
   * A rung's centre at a lateral place.
   *
   * @param ladder The ladder.
   * @param index The rung, 1 the lowest; 0 is the floor under the rungs.
   * @param x The lateral place in the ladder's frame, metres, `x` left.
   * @returns World metres.
   */
  export function rung(
    ladder: ILadder,
    index: number,
    x: number,
  ): IAutoMovieVector3 {
    return HumanFrame.point(ladder.frame, {
      x,
      y: index * ladder.spacing,
      z: ladder.ahead,
    });
  }

  /**
   * Plan a ladder climb.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the spacing lies outside the OSHA band or the rung count is not a positive integer.
   */
  export function plan(context: IHumanActionContext<IParams>): IPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const spacing: number = context.params.spacing ?? 0.3;
    const count: number = context.params.rungs ?? 3;
    HumanBound.within("spacing", spacing, 0.25, 0.36, "m");
    HumanBound.whole("rungs", count);
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const standing: IHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const yaw: number = standing.yaw;
    const flat = (side: "left" | "right"): HumanFoot.IPlacement => {
      const goal: IHumanPosture.IGoal = standing.limbs[`${side}Leg`]!;
      return {
        ankle: goal.point,
        rotation: goal.rotation ?? HumanFrame.turn(yaw),
      };
    };
    const origin: IAutoMovieVector3 = {
      ...Vector3.lerp(flat("left").ankle, flat("right").ankle, 0.5),
      y: 0,
    };
    const frame: HumanFrame.IFrame = { origin, yaw };
    const toe: number = Math.max(
      ...(["left", "right"] as const).map(
        (side) =>
          HumanFrame.local(
            frame,
            HumanFoot.point(body, side, "toe", flat(side)),
          ).z,
      ),
    );
    const ladder: ILadder = {
      frame,
      ahead: toe + (context.params.start ?? 0.15),
      spacing,
    };
    const lateral = (side: "left" | "right"): number =>
      HumanFrame.local(frame, flat(side).ankle).x;
    const reach: number = Math.round(
      (m.shoulderHeight - 0.5 * m.upperArm) / spacing,
    );

    // A foot's placement on a rung: the ball on the rung's top.
    const footOn = (
      side: "left" | "right",
      index: number,
    ): HumanFoot.IPlacement =>
      index === 0
        ? flat(side)
        : HumanFoot.pivot(
            body,
            side,
            "ball",
            Vector3.add(rung(ladder, index, lateral(side)), {
              x: 0,
              y: RUNG,
              z: 0,
            }),
            HumanFoot.heading(flat(side).rotation),
            0,
          );

    // The schedule: hands on, then four beats a rung.
    const beat: number = BEAT * modifiers.tempo;
    const instants: AutoMovieMotionClock.IInstant[] = [
      { name: "handsOn", seconds: beat },
    ];
    const moves: { limb: Limb; n: number; from: number; to: number }[] = [];
    for (let k: number = 1; k <= count; k++)
      ORDER.forEach((limb: Limb, i: number): void => {
        const from: number = beat * (1 + (k - 1) * 4 + i);
        moves.push({ limb, n: k, from, to: from + beat });
        instants.push(
          { name: `${limb}Release${k}`, seconds: from },
          { name: `${limb}Contact${k}`, seconds: from + beat },
        );
      });
    const duration: number = beat * (2 + count * 4);
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      duration,
      instants,
    );

    // Where a limb is at a second: its rung index (fractional while moving).
    const level = (
      limb: Limb,
      seconds: number,
    ): { index: number; from: number; u: number; moving: boolean } => {
      const base: number = limb.endsWith("Hand") ? reach : 0;
      let index: number = base;
      for (const move of moves)
        if (move.limb === limb) {
          if (seconds >= move.to) index = base + move.n;
          else if (seconds > move.from)
            return {
              index: base + move.n,
              from: base + move.n - 1,
              u: minimumJerk((seconds - move.from) / (move.to - move.from)).s,
              moving: true,
            };
        }
      return { index, from: index, u: 1, moving: false };
    };

    const climb: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "leftLeg", "rightLeg", "leftArm", "rightArm"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const limbs: IHumanPosture["limbs"] = {};
        const feet: Record<"left" | "right", HumanFoot.IPlacement> = {
          left: flat("left"),
          right: flat("right"),
        };
        for (const side of ["left", "right"] as const) {
          const at = level(`${side}Foot`, seconds);
          const a: HumanFoot.IPlacement = footOn(side, at.from);
          const b: HumanFoot.IPlacement = footOn(side, at.index);
          feet[side] = at.moving
            ? (() => {
                const out = AutoMovieMotionHumanLeg.arc(a, b, CLEARANCE, at.u);
                // Move back off the rungs and in again so the toe clears them.
                return {
                  ...out,
                  ankle: Vector3.add(
                    out.ankle,
                    HumanFrame.point(
                      { origin: { x: 0, y: 0, z: 0 }, yaw },
                      {
                        x: 0,
                        y: 0,
                        z: -2 * CLEARANCE * Math.sin(Math.PI * at.u),
                      },
                    ),
                  ),
                };
              })()
            : b;
        }

        // The pelvis behind the rungs at the feet's mean height.
        const rise: number =
          (feet.left.ankle.y + feet.right.ankle.y) / 2 - m.ankleHeight;
        const root: IAutoMovieVector3 = {
          ...HumanFrame.point(frame, {
            x: 0,
            y: 0,
            z: ladder.ahead - BACK * (m.thigh + m.shank),
          }),
          y: rise - stand.DROP,
        };
        const placed: IHumanPosture = { ...posture, root, yaw };
        for (const side of ["left", "right"] as const)
          limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
            body,
            placed,
            side,
            feet[side],
            !level(`${side}Foot`, seconds).moving,
          );
        const lowered: IHumanPosture = resolveHumanPosture.lower(body, {
          ...placed,
          limbs,
        });

        // Each hand grips its rung, reaching it from where it hung at first.
        const reachShare: number = clock.progress("start", "handsOn", seconds);
        for (const side of ["left", "right"] as const) {
          const at = level(`${side}Hand`, seconds);
          const grip: IAutoMovieVector3 = Vector3.lerp(
            rung(ladder, at.from, lateral(side)),
            rung(ladder, at.index, lateral(side)),
            at.u,
          );
          const lifted: IAutoMovieVector3 = at.moving
            ? Vector3.add(
                grip,
                HumanFrame.point(
                  { origin: { x: 0, y: 0, z: 0 }, yaw },
                  { x: 0, y: 0, z: -0.08 * Math.sin(Math.PI * at.u) },
                ),
              )
            : grip;
          const target = AutoMovieMotionHumanTarget.hand(
            body,
            lowered,
            side,
            {
              point: lifted,
              normal: HumanFrame.point(
                { origin: { x: 0, y: 0, z: 0 }, yaw },
                { x: 0, y: 0, z: -1 },
              ),
            },
            { surface: "grip", shape: "relaxed", curl: 50 },
          );
          limbs[`${side}Arm`] = AutoMovieMotionHumanArm.goal(
            body,
            side,
            target,
          );
        }
        const gripped: IHumanPosture = {
          ...lowered,
          limbs: {
            ...lowered.limbs,
            leftArm: limbs.leftArm!,
            rightArm: limbs.rightArm!,
          },
        };
        if (reachShare >= 1) return gripped;
        return AutoMovieMotionHumanArm.carry(
          body,
          gripped,
          {
            left: AutoMovieMotionHumanArm.angles(context.entry.pose, "left"),
            right: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
          },
          reachShare,
        );
      },
    };

    // Contact windows between each limb's moves.
    const contacts: IHumanContactWindow[] = [];
    for (const limb of ORDER) {
      const own = moves.filter((move) => move.limb === limb);
      const hand: boolean = limb.endsWith("Hand");
      let from: number = hand ? beat : 0;
      for (let i: number = 0; i <= own.length; i++) {
        const to: number = i < own.length ? own[i]!.from : duration;
        contacts.push({
          part: limb,
          kind: hand ? "grip" : "plant",
          from: from / duration,
          to: to / duration,
          support:
            !hand && i === 0
              ? { kind: "ground" }
              : { kind: "prop", subject: "ladder" },
        });
        if (i < own.length) from = own[i]!.to;
      }
    }

    return {
      ...composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, standing, contacts),
        clock,
        contact: "handsOn",
        primitives: [climb],
      }),
      ladder,
    };
  }

  /** A climb's plan: an action plan with the ladder it resolved. */
  export interface IPlan extends IHumanActionPlan {
    /** The ladder. */
    ladder: ILadder;
  }
}
