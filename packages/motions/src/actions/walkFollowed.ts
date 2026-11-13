import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { walkPaced } from "./walkPaced";

/**
 * A stepping plan walked at the speed of a person followed: while they
 * walk, the follower's speed along its own way follows theirs, and once
 * they have stopped it walks the rest of its way at its own pace.
 *
 * Followers match a leader's speed: the follower's acceleration is
 * proportional to the difference of the two speeds, `a = c (v_leader -
 * v_follower)` with `c` = `GAIN` (Rio, Rhea and Warren 2014, J Vis
 * 14(2):4, Table 1; fitted between 1 and 4 m of gap). So a follower sets
 * off as the person does, slows where they slow and stands while they
 * stand, and after a change of the person's speed by `dv` the gap has
 * changed by `dv / c`. The law holds the gap, it does not close it: what
 * is left of the follower's way when the person has stopped, or from the
 * place where the plan's own stop begins, is walked on the plan's own
 * clock, whose rate comes to 1 by the same first-order law, so the
 * follower stops as its own gait stops.
 *
 * The person's speed is the length their root travels between readings
 * `STEP` apart, and no more than `FASTEST` times the gait's own cruising
 * speed is matched: a follower that cannot keep up falls behind and
 * arrives after them. The plan's way is the length its root travels, read
 * at `SAMPLES` instants; its cruising speed is the median of the speeds
 * between them. A person who does not move leaves the plan as it is.
 * First pass: the plan's clock slows with the speed, so a slower follower
 * steps as long and less often, and one whose leader pauses holds its
 * stride where it is.
 *
 * @param plan The follower's stepping plan at its own pace.
 * @param where Where the person followed is at a film second.
 * @param from The film second the follower's plan begins.
 * @param rests The film second the person comes to rest.
 * @returns The plan at the person's speed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law and its source, what it does not do and how the way is finished, how the person and the plan are read, and what the first pass leaves out.
 * @evidence contracts/development/implementation.md#principled-implementation The cited first-order law is integrated exactly over each `TICK` for a speed held constant in it; the travelled length is turned into the plan's second through the plan's own way, and `walkPaced` plays the plan on that clock. Speed is continuous where the plan's own clock takes over because that clock starts at the rate the speed has there.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the person's speeds, read the plan's way, integrate the two phases into one clock, hand it to `walkPaced`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `GAIN` is the cited fit; `FASTEST`, `STEP`, `TICK`, `SAMPLES` and `CRUISE` are named and provisional. The speed bound is the gait's, not a clamp of what was asked: the follower then arrives late, as stated.
 * @evidence contracts/development/implementation.md#efficient-algorithms One reading of the person's root every `STEP` seconds and `SAMPLES` postures of the plan, once per plan; each tick of the clock costs one search of the way.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache beyond the readings and the clock built once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the clock for as long as the returned plan is held.
 */
export function walkFollowed(
  plan: IHumanActionPlan,
  where: (seconds: number) => IAutoMovieVector3,
  from: number,
  rests: number,
): IHumanActionPlan {
  // The person's speed between readings.
  const count: number = Math.ceil((rests - from) / walkFollowed.STEP);
  if (count < 1) return plan;
  const step: number = (rests - from) / count;
  const speeds: number[] = [];
  let before: IAutoMovieVector3 = where(from);
  let led: number = 0;
  for (let i: number = 1; i <= count; ++i) {
    const now: IAutoMovieVector3 = where(from + i * step);
    const length: number = Math.hypot(now.x - before.x, now.z - before.z);
    speeds.push(length / step);
    led += length;
    before = now;
  }

  // The plan's way: the length its root has travelled at each sampled second.
  const seconds: number[] = [0];
  const lengths: number[] = [0];
  let root: IHumanPosture["root"] = plan.posture(0).root;
  for (let i: number = 1; i <= walkFollowed.SAMPLES; ++i) {
    const t: number = (i / walkFollowed.SAMPLES) * plan.duration;
    const now: IHumanPosture["root"] = plan.posture(t).root;
    seconds.push(t);
    lengths.push(lengths[i - 1]! + Math.hypot(now.x - root.x, now.z - root.z));
    root = now;
  }
  const whole: number = lengths[walkFollowed.SAMPLES]!;
  if (led < 1e-6 || whole < 1e-9) return plan;
  const rate = (i: number): number =>
    (lengths[i]! - lengths[i - 1]!) / (seconds[i]! - seconds[i - 1]!);
  const rates: number[] = seconds
    .slice(1)
    .map((_: number, i: number): number => rate(i + 1));
  const cruise: number = [...rates].sort(
    (a: number, b: number): number => a - b,
  )[rates.length >> 1]!;

  // Where the plan's own stop begins: the end of its last stretch at cruising speed.
  let brake: number = whole;
  for (let i: number = walkFollowed.SAMPLES; i >= 1; --i)
    if (rates[i - 1]! >= walkFollowed.CRUISE * cruise) {
      brake = lengths[i]!;
      break;
    }
  const secondAt = (length: number): number => {
    let i: number = 1;
    while (i < walkFollowed.SAMPLES && lengths[i]! < length) ++i;
    const span: number = lengths[i]! - lengths[i - 1]!;
    return (
      seconds[i - 1]! +
      (span < 1e-12 ? 0 : Math.min(1, (length - lengths[i - 1]!) / span)) *
        (seconds[i]! - seconds[i - 1]!)
    );
  };

  // The follower's speed follows the person's while they walk and the plan's own stop has not begun.
  const tick: number = walkFollowed.TICK;
  const decay: number = Math.exp(-walkFollowed.GAIN * tick);
  const clock: number[] = [0];
  let travelled: number = 0;
  let speed: number = 0;
  for (
    let t: number = 0;
    t < rests - from && travelled < brake && clock.length < walkFollowed.TICKS;
    t += tick
  ) {
    const asked: number = Math.min(
      walkFollowed.FASTEST * cruise,
      speeds[Math.min(count - 1, Math.floor(t / step))]!,
    );
    travelled +=
      asked * tick + ((speed - asked) * (1 - decay)) / walkFollowed.GAIN;
    speed = asked + (speed - asked) * decay;
    clock.push(secondAt(Math.min(travelled, whole)));
  }

  // The rest of the way on the plan's own clock, its rate coming to 1 from the rate the speed has here.
  let planned: number = clock[clock.length - 1]!;
  const own: number =
    rates[
      Math.min(
        walkFollowed.SAMPLES - 1,
        Math.floor((planned / plan.duration) * walkFollowed.SAMPLES),
      )
    ]!;
  let pace: number =
    own > 1e-6 ? Math.min(walkFollowed.FASTEST, speed / own) : 1;
  while (
    planned < plan.duration - 1e-9 &&
    clock.length < walkFollowed.TICKS
  ) {
    planned += tick + ((pace - 1) * (1 - decay)) / walkFollowed.GAIN;
    pace = 1 + (pace - 1) * decay;
    clock.push(Math.min(plan.duration, planned));
  }
  clock[clock.length - 1] = plan.duration;
  return walkPaced(plan, tick, clock);
}

/**
 * Constants of {@link walkFollowed}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each constant states its unit, and its source or that it is provisional.
 * @evidence contracts/development/design.md#principled-representation A cited rate, a dimensionless factor, intervals in seconds and counts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The numbers the function reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Named and marked, not numbers inside the function.
 */
export namespace walkFollowed {
  /** The gain of speed matching, per second: a follower's acceleration per unit of speed difference from the leader (Rio, Rhea and Warren 2014, J Vis 14(2):4, Table 1). */
  export const GAIN: number = 1.87;

  /** The most of its gait's cruising speed a follower matches (provisional: beyond it a walk would have to become a run). */
  export const FASTEST: number = 1.5;

  /** Seconds between two readings of the followed person's place (provisional: a few readings a step). */
  export const STEP: number = 0.25;

  /** Seconds between two entries of the follower's clock (provisional: under a film frame). */
  export const TICK: number = 0.02;

  /** The most entries a clock holds: ten minutes of them, which no shot reaches. */
  export const TICKS: number = 30_000;

  /** Instants of the plan at which its way is read (provisional: a step is read several times over). */
  export const SAMPLES: number = 80;

  /** The share of its cruising speed under which the plan is taken to be stopping (provisional). */
  export const CRUISE: number = 0.9;
}
