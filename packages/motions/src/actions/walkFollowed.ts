import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { walkPaced } from "./walkPaced";

/**
 * A stepping plan walked at the pace of a person followed: the follower is
 * as far along its way as the person was along theirs `lag` seconds
 * earlier, from the moment the walk begins until `lag` after they stop.
 *
 * The person's way is the length their root travels, read every `STEP`
 * seconds between the two instants. A person who does not move in that
 * time leaves the plan at its own pace, and so does one whose way is over
 * sooner than `walkPaced.FASTEST` times the gait could cover the
 * follower's: the follower then walks at its own pace and arrives after
 * them.
 *
 * @param plan The follower's stepping plan at its own pace.
 * @param where Where the person followed is at a film second.
 * @param from The film second the follower's plan begins.
 * @param rests The film second the person comes to rest.
 * @param lag How long after the person the follower reaches the same share of its way, seconds.
 * @returns The plan at the person's pace.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is matched, how the person's way is read, the lag and the case of a person who stands.
 * @evidence contracts/development/implementation.md#principled-implementation The person's share of their way is their travelled length over the whole, linear between readings, delayed by the lag; `walkPaced` turns it into the follower's clock.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the person's way, build the share, hand it to `walkPaced`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `STEP` is a named, provisional reading interval; the share never falls because a length travelled never does.
 * @evidence contracts/development/implementation.md#efficient-algorithms One reading of the person's root every `STEP` seconds of their way, once per plan.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache beyond the readings taken once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the readings for as long as the returned plan is held.
 */
export function walkFollowed(
  plan: IHumanActionPlan,
  where: (seconds: number) => IAutoMovieVector3,
  from: number,
  rests: number,
  lag: number,
): IHumanActionPlan {
  const count: number = Math.ceil((rests - from) / walkFollowed.STEP);
  if (count < 1) return plan;
  const step: number = (rests - from) / count;
  const lengths: number[] = [0];
  let before: IAutoMovieVector3 = where(from);
  for (let i: number = 1; i <= count; ++i) {
    const now: IAutoMovieVector3 = where(from + i * step);
    lengths.push(
      lengths[i - 1]! + Math.hypot(now.x - before.x, now.z - before.z),
    );
    before = now;
  }
  const whole: number = lengths[count]!;

  // A person who stays where they are sets no pace, and one whose way is over sooner than the gait can cover the follower's is caught up with at the follower's own pace, arriving after them.
  if (
    whole < 1e-6 ||
    plan.duration > walkPaced.FASTEST * (rests - from + lag)
  )
    return plan;
  return walkPaced(
    plan,
    (seconds: number): number => {
      const at: number = Math.min(count, Math.max(0, (seconds - lag) / step));
      const i: number = Math.min(count - 1, Math.floor(at));
      return (
        (lengths[i]! + (lengths[i + 1]! - lengths[i]!) * (at - i)) / whole
      );
    },
    rests - from + lag,
  );
}

/**
 * Constant of {@link walkFollowed}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the unit and that it is provisional.
 * @evidence contracts/development/design.md#principled-representation One interval in seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one number the function reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Named and marked, not a number inside the function.
 */
export namespace walkFollowed {
  /** Seconds between two readings of the followed person's place (provisional: a few readings a step). */
  export const STEP: number = 0.25;
}
