import type { MotionTrajectoryRead } from "./MotionTrajectoryRead";

/**
 * Locate one completed dense interval for the full and quaternion-only readers.
 *
 * @param t0 The held left endpoint, seconds.
 * @param t1 The held right endpoint, seconds.
 * @param steps Completed forward steps, sorted by their actual start times.
 * @returns An integration-free reader of raw requested seconds. A held right end or NaN returns undefined; other reads lend one mutable location for synchronous use. Both consumers immediately read its step/share and never retain it in public output.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States seconds, sorted numeric inputs, clamped left time, held right/NaN behavior, interval share and internal borrowing.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the dense reader's existing right-end comparison, left clamp, binary search and (time-start)/h arithmetic once for both state blocks.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuse the immediately preceding raw requested time, otherwise hold the end or locate and divide.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Object.is keys preserve signed zero and NaN; no time grid, tolerance, approximate equality, interpolation or physical callback is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms A new interior time costs O(log A) search for A accepted steps and one division. Full and quaternion projections share that work; the second matching lookup costs O(1). One private location record is reused, so the projected path gains no per-query location allocation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both projections read the same immutable steps at the same raw time, so their interval and share are identical. Keys update only after the numeric read succeeds.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Captures numeric steps, two endpoints and one previous time plus one private location record. Both callers destructure the borrowed location synchronously before any other locate query; no location escapes into playback results or callback inputs. It retains no RHS, history or vector interpolation, and public values retain their copying boundary.
 */
export function MotionTrajectoryInterval(
  t0: number,
  t1: number,
  steps: readonly MotionTrajectoryRead.IDenseStep[],
): (time: number) => {
  /** The internally borrowed accepted step. */
  step: MotionTrajectoryRead.IDenseStep;
  /** The requested time's dimensionless share of that step. */
  u: number;
} | undefined {
  let previous: number | undefined;
  let entered: boolean = false;
  let value: { step: MotionTrajectoryRead.IDenseStep; u: number } | undefined;
  let location: typeof value;
  return (time: number): typeof value => {
    if (entered && Object.is(time, previous)) return value;
    let located: typeof value = undefined;
    if (time < t1) {
      const at: number = Math.max(t0, time);
      let lo: number = 0;
      let hi: number = steps.length - 1;
      while (lo < hi) {
        const mid: number = (lo + hi + 1) >> 1;
        if (steps[mid]!.t <= at) lo = mid;
        else hi = mid - 1;
      }
      const step: MotionTrajectoryRead.IDenseStep = steps[lo]!;
      const u: number = (at - step.t) / step.h;
      if (location === undefined) location = { step, u };
      else {
        location.step = step;
        location.u = u;
      }
      located = location;
    }
    value = located;
    previous = time;
    entered = true;
    return value;
  };
}
