import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";

/**
 * The pelvis's path over a flight of stairs (`climbStairs`): between the
 * stances, each the root over the middle of both feet after a step as high
 * as both legs reach from it.
 *
 * Its height changes while a foot swings and holds in double support: at the
 * tread contact the trailing leg, nearly straight over its foot, already
 * holds the new stance's height. Its progress over the floor runs half a
 * step behind the feet: at a tread contact it stands midway between the two
 * stances, over the trailing foot, as the body's centre does at the leading
 * foot's contact in stair ascent (McFadyen and Winter 1988, J Biomech
 * 21:733), and reaches the stance over both feet halfway through the next
 * step; the start of the climb counts as the contact before the first. So
 * the leading foot lands ahead of the hip with its knee part flexed, about
 * the 60 degrees the study reports, rather than under it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path's height and progress, their timing and its source.
 * @evidence contracts/development/design.md#principled-representation The pelvis path as one function of the stances and the step clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One builder, read by the stair law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The timing follows the step clock; the stair law still lowers the root wherever a leg falls short.
 */
export namespace climbStairsPelvis {
  /**
   * The pelvis's path.
   *
   * @param stance The root before the climb and after each step.
   * @param clock The step clock, with `toeOff<n>` and `treadContact<n>`.
   * @param steps How many steps.
   * @param duration The climb's seconds.
   * @returns The root at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result; the namespace gives the timing.
   * @evidence contracts/development/implementation.md#principled-implementation Minimum-jerk progress between stances, its height on the swing and its progress over the floor half a step behind.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepares contact and progress intervals once, then selects the height and floor spans separately.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts After the last step the path holds the last stance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear preparation/storage in steps includes fixed height differences, progress denominators and original XYZ interpolation deltas. Two logarithmic selections and constant-size interpolation remain per read; the prepared lerp's fresh output receives the original separate Y without a second vector copy.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The final clock/stances stay fixed, so named seconds, windows and original coordinate differences prepare once through the shared Vector3 owner. Every actual progress/lift still evaluates; only a guaranteed fresh interpolation vector is locally updated, never a retained stance or output from another read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader owns one set of interval arrays bounded by the step count and releases them with the plan, without retaining query history.
   */
  export function of(
    stance: readonly IAutoMovieVector3[],
    clock: AutoMovieMotionClock.IClock,
    steps: number,
    duration: number,
  ): (seconds: number) => IAutoMovieVector3 {
    const contacts: number[] = Array.from(
      { length: steps },
      (_: unknown, i: number): number => clock.at(`treadContact${i + 1}`),
    );
    const lifts: ((seconds: number) => number)[] = Array.from(
      { length: steps },
      (_: unknown, i: number): (seconds: number) => number =>
        AutoMovieMotionClock.prepare(clock, `toeOff${i + 1}`, `treadContact${i + 1}`).progress,
    );
    const ends: number[] = contacts.map((contact: number, i: number): number =>
      i + 1 < steps ? (contact + contacts[i + 1]!) / 2 : duration,
    );
    const starts: number[] = contacts.map((contact: number, i: number): number =>
      ((i === 0 ? 0 : contacts[i - 1]!) + contact) / 2,
    );
    const spans: number[] = ends.map((end: number, i: number): number => end - starts[i]!);
    const heights: number[] = contacts.map((_: number, i: number): number => stance[i + 1]!.y - stance[i]!.y);
    const positions: ReturnType<typeof Vector3.prepareLerp>[] = contacts.map((_: number, i: number): ReturnType<typeof Vector3.prepareLerp> => Vector3.prepareLerp(stance[i]!, stance[i + 1]!));
    const interval: (times: readonly number[], seconds: number) => number = (times: readonly number[], seconds: number): number => {
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
        const u: number = minimumJerk.share(
          Math.min(1, Math.max(0, (seconds - begin) / spans[progress]!)),
        );
        const point: IAutoMovieVector3 = positions[progress]!(u);
        point.y = y;
        return point;
      }
      return { ...stance.at(-1)!, y };
    };
  }
}
