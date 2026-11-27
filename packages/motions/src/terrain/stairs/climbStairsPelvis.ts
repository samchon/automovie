import { AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieVector3,
} from "@automovie/interface";

import { motionClock } from "../../compose/internal/motionClock";

/*
 * The pelvis's path.
 * Parameter stance: The root before the climb and after each step.
 * Parameter clock: The step clock, with `toeOff<n>` and `treadContact<n>`.
 * Parameter steps: How many steps.
 * Parameter duration: The climb's seconds.
 * Returns: The root at a second.
 */
export function climbStairsPelvis(
  stance: readonly IAutoMovieVector3[],
  clock: IAutoMovieMotionClock,
  steps: number,
  duration: number,
): (seconds: number) => IAutoMovieVector3 {
  const contacts: number[] = Array.from(
    { length: steps },
    (_: unknown, i: number): number => clock.at(`treadContact${i + 1}`),
  );
  const lifts: ((seconds: number) => number)[] = Array.from(
    { length: steps },
    (_: unknown, i: number): ((seconds: number) => number) =>
      motionClock.prepare(
        clock,
        `toeOff${i + 1}`,
        `treadContact${i + 1}`,
      ).progress,
  );
  const ends: number[] = contacts.map((contact: number, i: number): number =>
    i + 1 < steps ? (contact + contacts[i + 1]!) / 2 : duration,
  );
  const starts: number[] = contacts.map(
    (contact: number, i: number): number =>
      ((i === 0 ? 0 : contacts[i - 1]!) + contact) / 2,
  );
  const spans: number[] = ends.map(
    (end: number, i: number): number => end - starts[i]!,
  );
  const heights: number[] = contacts.map(
    (_: number, i: number): number => stance[i + 1]!.y - stance[i]!.y,
  );
  const positions: ReturnType<typeof AutoMovieEngineVector3.prepareLerp>[] = contacts.map(
    (_: number, i: number): ReturnType<typeof AutoMovieEngineVector3.prepareLerp> =>
      AutoMovieEngineVector3.prepareLerp(stance[i]!, stance[i + 1]!),
  );
  const interval: (times: readonly number[], seconds: number) => number = (
    times: readonly number[],
    seconds: number,
  ): number => {
    let low: number = 0;
    let high: number = times.length;
    while (low < high) {
      const middle: number = (low + high) >>> 1;
      if (seconds <= times[middle]!) high = middle;
      else low = middle + 1;
    }
    return low;
  };
  return (seconds: number): IAutoMovieVector3 => {
    let y: number = stance.at(-1)!.y;
    const height: number = interval(contacts, seconds);
    if (height < steps) {
      const lift: number = lifts[height]!(seconds);
      y = stance[height]!.y + heights[height]! * lift;
    }
    const progress: number = interval(ends, seconds);
    if (progress < steps) {
      const begin: number = starts[progress]!;
      const u: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.min(1, Math.max(0, (seconds - begin) / spans[progress]!)),
      );
      const point: IAutoMovieVector3 = positions[progress]!(u);
      point.y = y;
      return point;
    }
    return { ...stance.at(-1)!, y };
  };
}
