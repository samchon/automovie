import {
  carriedAcceleration,
  carriedRate,
  minimumJerk,
} from "@automovie/engine";

/**
 * The pelvis's descent onto a landing leg, scheduled ahead of the leg's own
 * claim.
 *
 * A swinging leg folds through mid-swing and asks nothing of the pelvis, then
 * straightens toward its heel strike and within a few hundredths of a second
 * asks the pelvis down by centimetres. Following that claim alone would start
 * the descent at the instant the leg runs out, at the leg's full rate. The
 * pelvis instead comes down from its mid-stance height to its double-support
 * one over the second half of single support (Perry and Burnfield): from
 * `START` of the swing it descends on a minimum-jerk profile (Flash and Hogan
 * 1985) to the largest lowering the leg will ask, arriving there at the
 * instant the leg asks it with the rate and the acceleration the leg's claim
 * has there (the engine's `carriedRate` and `carriedAcceleration`, mirrored
 * in time), and follows the leg's claim from then on. A leg near its full
 * reach turns a millimetre of slack into degrees of knee, so the slack the
 * schedule leaves has to close without a step in acceleration, which matching
 * the value and the rate alone would leave. The leg's own claim still holds
 * wherever it exceeds the schedule.
 */
export namespace walkDescent {
  /** A swing's scheduled descent. */
  export interface IPlan {
    /** The share of the swing at which the schedule meets the leg's claim. */
    until: number;

    /** The lowering the leg asks there, metres. */
    need: number;

    /** That lowering's rate there, metres per share of the swing. */
    rate: number;

    /** That lowering's acceleration there, metres per squared share of the swing. */
    bend: number;
  }

  /** The share of a swing at which its descent begins: mid-swing, where the schedule turns from the stance the foot left to the one it lands in. */
  export const START: number = 0.5;

  /**
   * Schedule a swing's descent.
   *
   * @param need The lowering the swinging leg asks at a share of its swing,
   *   metres, negative by its slack.
   * @returns The schedule, meeting the claim at its largest sampled value
   *   with the claim's rate and acceleration there, by backward differences.
   */
  export function plan(need: (u: number) => number): IPlan {
    let until: number = 1;
    let most: number = need(1);
    for (let k: number = SAMPLES / 4; k < SAMPLES; k++) {
      const u: number = START + ((1 - START) * k) / SAMPLES;
      const value: number = need(u);
      if (value > most) {
        most = value;
        until = u;
      }
    }
    const before: number = need(until - STEP);
    const earlier: number = need(until - 2 * STEP);
    return {
      until,
      need: most,
      rate: (3 * most - 4 * before + earlier) / (2 * STEP),
      bend: (most - 2 * before + earlier) / (STEP * STEP),
    };
  }

  /**
   * A swinging leg's claim on the pelvis under its schedule.
   *
   * @param schedule The swing's schedule.
   * @param u The share of the swing, from `START` on.
   * @param actual The lowering the leg asks at that share, metres.
   * @param from The claim the descent starts from, metres: a foot's that asks
   *   nothing.
   * @returns The claim, metres.
   */
  export function claim(
    schedule: IPlan,
    u: number,
    actual: number,
    from: number,
  ): number {
    if (u >= schedule.until) return actual;
    const span: number = schedule.until - START;
    const x: number = Math.max(0, (u - START) / span);
    return Math.max(
      actual,
      from +
        (schedule.need - from) * minimumJerk(x).s -
        schedule.rate * span * carriedRate(1, 1 - x) +
        schedule.bend * span * span * carriedAcceleration(1, 1 - x),
    );
  }

  /** The shares of a swing's second half sampled for its largest claim (provisional): the claim is smooth, and the schedule meets it at the sampled share with its rate and acceleration there, whichever share that is. */
  const SAMPLES: number = 16;

  /** The share of a swing over which the claim's rate and acceleration are differenced. */
  const STEP: number = 4e-3;
}
