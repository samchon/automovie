import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBodyMeasure } from "../body/IBodyMeasure";

/**
 * The walking law of a fifteen-year-old: pace by intent, step length scaled
 * from stature, whole-step plans and the swing of each step, from the 14–21
 * year normative gait of Voss et al. (2020) as the walking study records it.
 *
 * A walk of distance D takes n steps, the last a closing half step that sets
 * the trailing foot beside the planted one: n = ⌈D / L⌉ + 1 for a step
 * length L, every full step D / (n − 1) long, each lasting one step period.
 *
 * ```ts
 * const plan = Gait.plan(2.6, measure, "ordinary"); // { steps, length, period, duration }
 * Gait.swing(plan, 0.4); // which foot swings and how far through its swing
 * ```
 *
 * @evidence docs/research/everyday/walking.md#gait Self-selected 1.28 ± 0.15 m/s at 115.4 ± 8.2 steps/min; fast 1.65 ± 0.17 m/s at 132.7 ± 8.8 steps/min; double support 17.9% and swing 41.1% of the cycle.
 * @evidence docs/research/everyday/walking.md#pace Hesitant, ordinary, hurried and run paces.
 * @evidence docs/research/everyday/walking.md#transitions Whole steps; the last step closes beside the planted foot; a turn of up to 180° takes two steps.
 * @evidence contracts/development/common.md#meaningful-documentation States the plan formula, units and source values.
 * @evidence contracts/development/design.md#principled-representation Speeds in m/s, cadences in steps per minute, lengths in metres and periods in seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The plan and swing the walk motion and timing read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Pace is data; no person is named.
 */
export namespace Gait {
  /** A walking intent's pace. */
  export type Pace = "hesitant" | "ordinary" | "hurried" | "run";

  /** Speed and cadence of a pace for a body of the study's mean stature. */
  export interface IPace {
    /** Metres per second. */
    speed: number;

    /** Steps per minute. */
    cadence: number;
  }

  /** Paces: ordinary and hurried are the 14–21 year means; hesitant and run are the study's production choices. */
  export const PACES: Readonly<Record<Pace, IPace>> = Object.freeze({
    hesitant: { speed: 1.0, cadence: 102 },
    ordinary: { speed: 1.28, cadence: 115.4 },
    hurried: { speed: 1.65, cadence: 132.7 },
    run: { speed: 2.5, cadence: 160 },
  });

  /** Mean stature of the 14–21 group the step lengths scale from, metres: a production inference, the mean of the CDC 50th-percentile statures of that age range for both sexes. */
  export const REFERENCE_STATURE: number = 1.69;

  /** Share of a step during which the moving foot swings; the rest is double support (17.9% of the cycle is two double-support periods, one per step). */
  export const SWING_SHARE: number = 1 - 0.179;

  /** Ankle rise at mid-swing, metres: a production choice large enough to read at the films' scale. */
  export const LIFT: number = 0.07;

  /** Vertical pelvis excursion per step, metres: a production choice for the walk's bob. */
  export const BOB: number = 0.02;

  /** Shoulder flexion amplitude of the arm swing, degrees: a production choice. */
  export const ARM_SWING: number = 16;

  /** A distance below which no step is planned, metres. */
  export const STILL: number = 0.03;

  /** A walk's plan. */
  export interface IPlan {
    /** Whole steps, including the closing half step. */
    steps: number;

    /** Length of each full step, metres. */
    length: number;

    /** Seconds per step. */
    period: number;

    /** Seconds of the whole walk. */
    duration: number;

    /** Distance walked, metres. */
    distance: number;
  }

  /**
   * A body's step length at a pace: the pace's speed over its step rate,
   * scaled by stature over the reference stature.
   *
   * @param measure The walker.
   * @param pace The pace.
   * @returns Metres.
   * @evidence docs/research/everyday/walking.md#gait Stride 1.34 m at 115 steps/min for the group mean; step length scales with leg length.
   * @evidence contracts/development/common.md#meaningful-documentation States the formula.
   * @evidence contracts/development/implementation.md#principled-implementation Speed over step rate is the measured step; the stature ratio is the study's stated inference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The study's paces.
   * @evidence contracts/development/behaviors.md#relational-goals Reads no position.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function stepLength(measure: IBodyMeasure, pace: Pace): number {
    const p: IPace = PACES[pace];
    return (
      (p.speed / (p.cadence / 60)) * (measure.stature / REFERENCE_STATURE)
    );
  }

  /**
   * Plan a walk of a distance.
   *
   * @param distance Metres along the floor.
   * @param measure The walker.
   * @param pace The pace.
   * @returns The plan; a still plan of zero steps below a few centimetres.
   * @evidence docs/research/everyday/walking.md#transitions Whole steps, closing half step.
   * @evidence contracts/development/common.md#meaningful-documentation States the zero plan.
   * @evidence contracts/development/implementation.md#principled-implementation n = ⌈D / L⌉ + 1 whole steps, each a step period of the pace.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One computation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws Cadences of the study.
   * @evidence contracts/development/behaviors.md#relational-goals Reads only the distance it is given.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function plan(
    distance: number,
    measure: IBodyMeasure,
    pace: Pace,
  ): IPlan {
    const period: number = 60 / PACES[pace].cadence;
    if (!(distance > STILL))
      return { steps: 0, length: 0, period, duration: 0, distance: 0 };
    const nominal: number = stepLength(measure, pace);
    const steps: number = Math.ceil(distance / nominal - 1e-9) + 1;
    return {
      steps,
      length: distance / (steps - 1),
      period,
      duration: steps * period,
      distance,
    };
  }

  /**
   * Steps of a turn in place: none below 3°, one up to 45°, else two.
   *
   * @param turn Radians, either sign.
   * @returns Whole steps.
   * @evidence docs/research/everyday/walking.md#transitions A turn of up to 45° fits inside a step; up to 180° takes two.
   * @evidence contracts/development/common.md#meaningful-documentation States the thresholds.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the study's thresholds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 3° floor ignores rounding noise only.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The study's turn steps.
   * @evidence contracts/development/behaviors.md#relational-goals Reads no position.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function turnSteps(turn: number): number {
    const a: number = Math.abs(turn);
    return a < (3 * Math.PI) / 180 ? 0 : a <= Math.PI / 4 ? 1 : 2;
  }

  /** The state of a walk at one instant. */
  export interface ISwing {
    /** Index of the current step, 0-based; equal to `steps` when finished. */
    step: number;

    /** Share of the swing completed by the moving foot, 0 to 1, or 1 in double support. */
    swing: number;

    /** Share of the whole distance the pelvis has covered, 0 to 1. */
    progress: number;
  }

  /**
   * Where a walk is at a local time: the step under way, how far its foot has
   * swung, and how far the pelvis has travelled, easing over the first and
   * last steps so the walk starts and stops with the feet.
   *
   * @param plan The plan.
   * @param local Seconds since the walk began.
   * @returns The swing state.
   * @evidence docs/research/everyday/walking.md#gait The moving foot swings for the swing share of each step.
   * @evidence contracts/development/common.md#meaningful-documentation States what each value means.
   * @evidence contracts/development/implementation.md#principled-implementation The pelvis covers each full step during its period, with a smoothstep easing over the first step and over the closing half step.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One function of time.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The study's swing share.
   * @evidence contracts/development/behaviors.md#relational-goals Reads no position.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure in the local time.
   */
  export function swing(plan: IPlan, local: number): ISwing {
    if (plan.steps === 0) return { step: 0, swing: 1, progress: 1 };
    const t: number = Math.max(0, Math.min(plan.duration, local));
    const step: number = Math.min(plan.steps, Math.floor(t / plan.period));
    const within: number = step >= plan.steps ? 1 : (t - step * plan.period) / plan.period;
    const swung: number = Math.min(1, within / SWING_SHARE);
    // The pelvis travels the full distance over the n − 1 full steps plus half of the closing step.
    const span: number = plan.steps - 0.5;
    const raw: number = Math.min(1, t / (plan.period * span));
    return {
      step,
      swing: step >= plan.steps ? 1 : smooth(swung),
      progress: ease(raw, 1 / span),
    };
  }

  /** Smoothstep on [0, 1]. */
  function smooth(u: number): number {
    return u * u * (3 - 2 * u);
  }

  /** Constant-speed progress with quadratic easing over the first and last `edge` of the span, continuous in slope. */
  function ease(u: number, edge: number): number {
    const e: number = Math.min(0.5, edge);
    const v: number = 1 / (1 - e); // peak speed so the area is 1
    if (u <= e) return (v * u * u) / (2 * e);
    if (u >= 1 - e) return 1 - (v * (1 - u) * (1 - u)) / (2 * e);
    return (v * e) / 2 + v * (u - e);
  }
  /**
   * The point a share of the way along a walked path by its floor length: a
   * straight walk's two ends, or a walk bent around someone through its bend.
   *
   * @param path Floor points in walking order, at least one.
   * @param share Share of the way, clamped to [0, 1].
   * @returns World metres.
   */
  export function along(path: readonly IAutoMovieVector3[], share: number): IAutoMovieVector3 {
    let left: number = Math.max(0, Math.min(1, share)) * length(path);
    for (let k = 1; k < path.length; k++) {
      const a: IAutoMovieVector3 = path[k - 1]!;
      const b: IAutoMovieVector3 = path[k]!;
      const d: number = Math.hypot(b.x - a.x, b.z - a.z);
      if (left <= d || k === path.length - 1) {
        const u: number = d < 1e-9 ? 1 : Math.min(1, left / d);
        return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u };
      }
      left -= d;
    }
    return path[path.length - 1]!;
  }

  /**
   * A walked path's floor length.
   *
   * @param path Floor points in walking order.
   * @returns Metres.
   */
  export function length(path: readonly IAutoMovieVector3[]): number {
    let s: number = 0;
    for (let k = 1; k < path.length; k++) s += Math.hypot(path[k]!.x - path[k - 1]!.x, path[k]!.z - path[k - 1]!.z);
    return s;
  }

}
