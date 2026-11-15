import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { walkStation } from "./walkStation";

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
 * @evidence contracts/development/implementation.md#principled-implementation The person is a moving point, and the speed-matching law that keeps station on one is `walkStation`'s, its one owner.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `walkStation` with the person's root as the point.
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
  // The person is a moving point, kept station on by the one speed-matching law.
  return walkStation(plan, where, from, rests);
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
  /** The gain of speed matching, per second (`walkStation.GAIN`). */
  export const GAIN: number = walkStation.GAIN;

  /** The most of its gait's cruising speed a follower matches (`walkStation.FASTEST`). */
  export const FASTEST: number = walkStation.FASTEST;

  /** Seconds between two readings of the followed person's place (`walkStation.STEP`). */
  export const STEP: number = walkStation.STEP;

  /** Seconds between two entries of the follower's clock (`walkStation.TICK`). */
  export const TICK: number = walkStation.TICK;

  /** The most entries a clock holds (`walkStation.TICKS`). */
  export const TICKS: number = walkStation.TICKS;

  /** Instants of the plan at which its way is read (`walkStation.SAMPLES`). */
  export const SAMPLES: number = walkStation.SAMPLES;

  /** The share of its cruising speed under which the plan is taken to be stopping (`walkStation.CRUISE`). */
  export const CRUISE: number = walkStation.CRUISE;
}