import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/**
 * Fighting-stance footwork: steps that keep the stance, the foot on the side
 * of travel moving first and the other following to restore the stance
 * without crossing (IBA coaching manual pp. 36 to 39: forward, the lead foot
 * then the rear; back, the rear then the lead; sideways, the near foot then
 * the far).
 *
 * Each step moves the whole stance by its length along the direction in the
 * body's line frame: the first foot swings in the first half of the step, the
 * second follows in the second, each on a minimum-jerk path lifted clear of
 * the floor, while the root carries the body on its own minimum-jerk profile
 * and the guard rides on the trunk. The step length defaults to half a
 * stance length (the kickboxing research's step share) and the step period to
 * 0.35 s, about three steps a second, inside the 2 to 3.5 steps a second of
 * the ring-movement reading (provisional).
 *
 * The action is rows over the entry's posture: one clock with each step's
 * landings, a stance row that carries the root and the two legs together
 * (the root is lowered onto the planted feet), and an arm row that keeps the
 * guard. The manner's tempo scales the step period and its step factor the
 * step length, up to one stance length.
 */
export namespace step {
  /** The action's name. */
  export const name: HumanActionName = "step";

  /** Cancel table: footwork chains into strikes, defences and more footwork at any time. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    step: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    guard: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
    punch: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    kick: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    defend: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
  };

  /** Parameters. */
  export interface IParams {
    /** The direction in the stance's own frame. */
    direction: "forward" | "back" | "left" | "right";

    /** How many steps; 1 when absent. */
    steps?: number;

    /** Each step's length, metres; half a stance length when absent. */
    length?: number;

    /** How it is performed: the tempo scales the period, the step factor the length. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** Seconds per step at a neutral manner (provisional). */
  export const PERIOD: number = 0.35;

  /** Share of a stance length one step covers (IBA: the following foot restores the stance without crossing). */
  export const STEP_SHARE: number = 0.5;

  /** The shares of a step at which the first foot lands, the second lifts and the second lands. */
  export const SHARES: readonly [number, number, number] = [0.5, 0.45, 0.95];

  /**
   * Plan footwork.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the step count is not a whole number of at least one, the length leaves (0, one stance length], or the manner is out of range.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const count: number = p.steps ?? 1;
    if (!(Number.isInteger(count) && count >= 1))
      throw new Error("Footwork takes a whole number of steps");
    const body = context.body;
    const stated: number = p.length ?? STEP_SHARE * StrikingStance.length(body);
    if (!(stated > 0 && stated <= StrikingStance.length(body)))
      throw new Error(
        `A step's length lies in (0, ${StrikingStance.length(body).toFixed(3)}] m`,
      );
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const length: number = Math.min(
      StrikingStance.length(body),
      stated * modifiers.step,
    );
    const period: number = PERIOD * modifiers.tempo;
    const duration: number = count * period;
    const entry: IHumanPosture = context.entry.posture;
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const rear: "left" | "right" = StrikingStance.rear({ lead });

    // The line frame: the stance's line is the heading turned back by the
    // stance turn; the direction is read in it.
    const line: number =
      entry.yaw +
      (lead === "left" ? StrikingStance.TURN : -StrikingStance.TURN);
    const r: number = (line * Math.PI) / 180;
    const forward: IAutoMovieVector3 = { x: Math.sin(r), y: 0, z: Math.cos(r) };
    const left: IAutoMovieVector3 = { x: Math.cos(r), y: 0, z: -Math.sin(r) };
    const unit: IAutoMovieVector3 =
      p.direction === "forward"
        ? forward
        : p.direction === "back"
          ? Vector3.scale(forward, -1)
          : p.direction === "left"
            ? left
            : Vector3.scale(left, -1);
    const first: "left" | "right" =
      p.direction === "forward"
        ? lead
        : p.direction === "back"
          ? rear
          : p.direction === "left"
            ? "left"
            : "right";
    const feet: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);
    const lift: number = 0.015 * body.measure.stature;

    // Each step: the first foot lands, the second lifts just before and
    // lands, and the step ends.
    const steps: number[] = Array.from(
      { length: count },
      (_: unknown, k: number): number => k,
    );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      duration,
      [
        ...steps.flatMap((k: number): AutoMovieMotionClock.IInstant[] => [
          { name: `secondUp${k + 1}`, seconds: (k + SHARES[1]) * period },
          { name: `firstDown${k + 1}`, seconds: (k + SHARES[0]) * period },
          { name: `secondDown${k + 1}`, seconds: (k + SHARES[2]) * period },
          { name: `step${k + 1}`, seconds: (k + 1) * period },
        ]),
        { name: "stroke", seconds: duration },
        { name: "relax", seconds: duration },
      ],
    );
    const START: string = AutoMovieMotionClock.START;
    const END: string = AutoMovieMotionClock.END;
    const swing = (
      side: "left" | "right",
      k: number,
    ): readonly [string, string] =>
      side === first
        ? [k === 0 ? START : `step${k}`, `firstDown${k + 1}`]
        : [`secondUp${k + 1}`, `secondDown${k + 1}`];
    const placed = (
      side: "left" | "right",
      seconds: number,
    ): { placement: HumanFoot.IPlacement; down: boolean } => {
      let travelled: number = 0;
      let raised: number = 0;
      let down: boolean = true;
      for (const k of steps) {
        const [a, b] = swing(side, k);
        const s: number = clock.progress(a, b, seconds);
        travelled += s;
        if (seconds > clock.at(a) && seconds < clock.at(b)) {
          down = false;
          raised = 4 * s * (1 - s);
        }
      }
      return {
        placement: {
          ankle: Vector3.add(feet[side].ankle, {
            x: unit.x * travelled * length,
            y: lift * raised,
            z: unit.z * travelled * length,
          }),
          rotation: feet[side].rotation,
        },
        down,
      };
    };

    // The root is carried the whole way on one profile and lowered until
    // each planted leg reaches its foot.
    const stance: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const l = placed("left", seconds);
        const r = placed("right", seconds);
        return resolveHumanPosture.lower(
          body,
          {
            ...posture,
            root: Vector3.add(
              entry.root,
              Vector3.scale(
                unit,
                count * length * clock.progress(START, END, seconds),
              ),
            ),
            limbs: {
              ...posture.limbs,
              ...StrikingStance.legs(
                body,
                { left: l.placement, right: r.placement },
                { left: l.down, right: r.down },
              ),
            },
          },
          5,
        );
      },
    };
    const arms: IAutoMovieMotionHumanPrimitive = {
      channels: ["leftArm", "rightArm"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture): IHumanPosture => ({
        ...posture,
        limbs: {
          ...posture.limbs,
          ...StrikingStance.guard(body, posture, { lead }),
        },
      }),
    };

    const contacts: IHumanContactWindow[] = [];
    for (const k of steps)
      for (const side of ["left", "right"] as const) {
        const [a, b] = swing(side, k);
        contacts.push({
          part: `${side}Foot`,
          kind: "plant",
          from: k === 0 ? 0 : clock.at(swing(side, k - 1)[1]) / duration,
          to: clock.at(a) / duration,
          support: { kind: "ground" },
        });
        if (k === count - 1)
          contacts.push({
            part: `${side}Foot`,
            kind: "plant",
            from: clock.at(b) / duration,
            to: 1,
            support: { kind: "ground" },
          });
      }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(
        duration,
        {
          root: entry.root,
          yaw: entry.yaw,
          pitch: entry.pitch,
          roll: entry.roll,
          joints: { ...entry.joints, ...StrikingStance.joints() },
          limbs: {},
        },
        contacts,
      ),
      clock,
      primitives: [stance, arms],
    });
  }
}
