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
import { HumanLadder } from "./HumanLadder";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Climbing a vertical fixed ladder from the floor before it, in the
 * four-beat ipsilateral pattern: right hand, right foot, left hand, left
 * foot, one limb moving at a time, so three limbs always hold the ladder
 * (Jensen and Holland 2020, Int J Environ Res Public Health 17:2897).
 *
 * The goals are rungs: the ladder is a prop of the scene, a fixture
 * (`IHumanProp.fixed`) that the hands grip and never carry, and its rungs are
 * its own `rung1` upward (`createLadder`'s affordances), read where the
 * ladder stands at the action's start. The rungs' spacing must lie in OSHA
 * 1910.23(b)(2)'s 25 to 36 cm and their line be upright; the climber stands
 * before the ladder, facing it within `FACING` degrees, the toes within
 * `NEAR` of the rungs and between the rails. A ladder that is no fixture,
 * leans, has too few rungs above the hands, or one the climber stands away
 * from, is refused. Each foot stands with its ball on a rung's top,
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
   * @evidence contracts/development/design.md#principled-representation The ladder as the scene's prop, and how far to climb.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hold is typed.
   */
  export interface IParams {
    /** The ladder's prop subject: a fixture whose rungs are its `rung1` upward. */
    ladder: string;

    /** How many rungs the feet climb; 3 when absent. */
    rungs?: number & tags.Type<"uint32"> & tags.Minimum<1> & HumanUnit<"">;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** One beat's seconds (provisional). */
  export const BEAT: number = 0.8;

  /** How far a swinging foot clears its path's straight line, metres (provisional). */
  export const CLEARANCE: number = 0.06;

  /** How far the hip joints stay behind the rungs, in leg lengths (provisional). */
  export const BACK: number = 0.35;

  /** The most the climber's heading may differ from facing the ladder, degrees (provisional). */
  export const FACING: number = 30;

  /** The farthest the toes may stand from the rungs, metres (provisional): a step from the ladder. */
  export const NEAR: number = 0.5;

  /** The beat order of the four-beat ipsilateral pattern. */
  export const ORDER: readonly Limb[] = [
    "rightHand",
    "rightFoot",
    "leftHand",
    "leftFoot",
  ];

  /** A limb of the climb. */
  export type Limb = "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

  /** A ladder as the plan resolved it (`HumanLadder.ILadder`). */
  export type ILadder = HumanLadder.ILadder;

  /** A rung's centre at a lateral place (`HumanLadder.rung`). */
  export const rung: typeof HumanLadder.rung = HumanLadder.rung;

  /** A rung's radius when the ladder declares none (`HumanLadder.RUNG`). */
  export const RUNG: number = HumanLadder.RUNG;

  /**
   * Plan a ladder climb.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the ladder is no fixture, leans, spaces its rungs outside the OSHA band or has too few above the hands, the climber does not stand before it facing it, or the rung count is not a positive integer.
   */
  export function plan(context: IHumanActionContext<IParams>): IPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const count: number = context.params.rungs ?? 3;
    HumanBound.whole("rungs", count);
    const ladder: ILadder = HumanLadder.of(context, context.params.ladder);
    const spacing: number = ladder.spacing;
    const frame: HumanFrame.IFrame = ladder.frame;
    const yaw: number = frame.yaw;
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const standing: IHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const flat = (side: "left" | "right"): HumanFoot.IPlacement => {
      const goal: IHumanPosture.IGoal = standing.limbs[`${side}Leg`]!;
      return {
        ankle: goal.point,
        rotation: goal.rotation ?? HumanFrame.turn(standing.yaw),
      };
    };

    // The climber stands before the ladder, facing it, the toes near the
    // rungs and the feet between the rails.
    const turned: number =
      Math.abs(((((standing.yaw - yaw) % 360) + 540) % 360) - 180);
    HumanBound.within("facing", turned, 0, FACING, "degrees");
    const toe: number = Math.max(
      ...(["left", "right"] as const).map(
        (side: "left" | "right"): number =>
          HumanFrame.local(
            frame,
            HumanFoot.point(body, side, "toe", flat(side)),
          ).z,
      ),
    );
    HumanBound.within("toes", -toe, 0, NEAR, "m");
    const lateral = (side: "left" | "right"): number =>
      HumanFrame.local(frame, flat(side).ankle).x;
    HumanBound.within(
      "beside",
      Math.abs((lateral("left") + lateral("right")) / 2),
      0,
      ladder.width / 2,
      "m",
    );
    const reach: number = Math.round(
      (m.shoulderHeight - 0.5 * m.upperArm) / spacing,
    );
    HumanBound.within("rungs", reach + count, 1, ladder.count, "");

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
              y: ladder.radius,
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
              : { kind: "prop", subject: context.params.ladder },
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
