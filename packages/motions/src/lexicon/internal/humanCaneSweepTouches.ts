import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { AutoMovieHumanSide } from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * A long cane's touches over a walk: the walk's legs are read at `RATE` while
 * the hand holds the cane pose (after `REACH` to it and before `RETURN` from
 * it), and each landing, a leg becoming planted, puts the tip down on the side
 * opposite the landing foot, as the two-point touch places it.
 *
 * @param planted Which legs the walk plants at a second.
 * @param duration The sweep's seconds.
 * @returns The touches in order.
 * @throws {HumanRefusal} When the walk lands no foot within the sweep.
 */
export function humanCaneSweepTouches(
  planted: (seconds: number) => Record<AutoMovieHumanSide, boolean>,
  duration: number,
): humanCaneSweepTouches.ITouch[] {
  const ready: number = Math.min(humanCaneSweepTouches.REACH, duration / 2);
  const relax: number = Math.max(
    duration / 2,
    duration - humanCaneSweepTouches.RETURN,
  );
  const touches: humanCaneSweepTouches.ITouch[] = [];
  const steps: number = Math.ceil(duration * humanCaneSweepTouches.RATE);
  let before: Record<AutoMovieHumanSide, boolean> | undefined;
  for (let k: number = 0; k <= steps; ++k) {
    const t: number = (k / steps) * duration;
    if (t < ready || t > relax) continue;
    const now: Record<AutoMovieHumanSide, boolean> = planted(t);
    if (before !== undefined)
      for (const foot of ["left", "right"] as const)
        if (now[foot] && !before[foot])
          touches.push({ at: t, side: foot === "left" ? "right" : "left" });
    before = now;
  }
  if (touches.length === 0)
    throw new HumanRefusal({
      kind: "base",
      axis: "duration",
      value: duration,
      reason: "the walk lands no foot within the sweep",
      fix: "sweep over a walk of at least one step",
    });
  return touches;
}

/** The cane's touches. */
export namespace humanCaneSweepTouches {
  /**
   * The rate the walk's steps are read at, per second: two 60 Hz frames resolve
   * a landing.
   */
  export const RATE: number = 60;

  /**
   * How far before its span ends the arm leaves the cane pose, seconds
   * (provisional: a short return).
   */
  export const RETURN: number = 0.3;

  /** How long the arm takes to the cane pose, seconds (provisional: a reach). */
  export const REACH: number = 0.5;

  /**
   * The most the tip rises between touches, metres: no more than an inch above
   * the ground (APH, Orientation and mobility, the two-point touch).
   */
  export const LIFT: number = 0.025;

  /** One touch: when, and on which side of the walker the tip comes down. */
  export interface ITouch {
    /** Seconds since the sweep's start. */
    at: number;

    /** The walker's side the tip touches: opposite the foot that lands. */
    side: AutoMovieHumanSide;
  }

  /** The tip's place across the walker and above the floor. */
  export interface ITip {
    /** Metres toward the walker's left. */
    lateral: number;

    /** Metres above the floor. */
    height: number;
  }

  /**
   * The tip at a second: resting on the first touch's place before it and on
   * the last's after it, and between two touches crossing on a minimum-jerk
   * share, lifted at most `LIFT` (two-point) or sliding on the floor (constant
   * contact).
   *
   * @param touches The touches in order.
   * @param seconds Seconds since the sweep's start.
   * @param wide How far to either side the tip touches, metres.
   * @param twoPoint Whether the tip lifts between touches.
   * @returns The tip's lateral place and height.
   */
  export function tip(
    touches: readonly ITouch[],
    seconds: number,
    wide: number,
    twoPoint: boolean,
  ): ITip {
    const sideOf = (touch: ITouch): number => (touch.side === "left" ? 1 : -1);
    let i: number = touches.findIndex(
      (touch: ITouch): boolean => touch.at > seconds,
    );
    if (i === -1) i = touches.length;
    if (i === 0) return { lateral: sideOf(touches[0]!) * wide, height: 0 };
    if (i === touches.length)
      return { lateral: sideOf(touches.at(-1)!) * wide, height: 0 };
    const a: ITouch = touches[i - 1]!;
    const b: ITouch = touches[i]!;
    const s: number = (seconds - a.at) / (b.at - a.at);
    return {
      lateral:
        (sideOf(a) + (sideOf(b) - sideOf(a)) * AutoMovieEngineMotionSampling.minimumJerkShare(s)) * wide,
      height: twoPoint ? LIFT * Math.sin(Math.PI * s) : 0,
    };
  }
}
