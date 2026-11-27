import type { MotionTrajectoryRead } from "./MotionTrajectoryRead";

/*
 * Locate one completed dense interval for the full and quaternion-only readers.
 * Parameter t0: The held left endpoint, seconds.
 * Parameter t1: The held right endpoint, seconds.
 * Parameter steps: Completed forward steps, sorted by their actual start times.
 * Returns: An integration-free reader of raw requested seconds. A held right
 * end or NaN returns undefined; other reads lend one mutable location for
 * synchronous use. Both consumers immediately read its step/share and never
 * retain it in public output.
 */
export function MotionTrajectoryInterval(
  t0: number,
  t1: number,
  steps: readonly MotionTrajectoryRead.IDenseStep[],
): (time: number) =>
  | {
      /*
       * The internally borrowed accepted step.
       */
      step: MotionTrajectoryRead.IDenseStep;
      /*
       * The requested time's dimensionless share of that step.
       */
      u: number;
    }
  | undefined {
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
