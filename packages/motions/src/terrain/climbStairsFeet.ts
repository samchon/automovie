import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanFoot,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";

/**
 * Prepare each stair foot's timed swings and select its active interval.
 *
 * @param prints The ordered footprints and step numbers for each side.
 * @param clock The climb's final clock, in action seconds.
 * @param swing The clearance-path builder for two consecutive footprints.
 * @returns Each foot's placement and bearing state at any action second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States preparation inputs, timebase, random-access query and bearing result.
 * @evidence contracts/development/implementation.md#principled-implementation Selects the first tread contact strictly after the query, preserving the planted branch before toe-off and the original clamped clock-linear progress during swing.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation pass per side precedes a binary interval lookup and at most one clearance-path evaluation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains every footprint, clearance path, toe-off and contact time and keeps the last foot planted.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear preparation and storage in footprints, logarithmic interval selection and constant-size evaluation per read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Footprints and the final clock are fixed for the plan, so each interval shares its resolved seconds and prepared clearance path.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader retains one interval per swing and releases those arrays with the climb plan; query history is not stored.
 */
export function climbStairsFeet(
  prints: Readonly<Record<"left" | "right", readonly {
    print: { placement: IAutoMovieMotionHumanFoot.IPlacement };
    step: number;
  }[]>>,
  clock: IAutoMovieMotionClock,
  swing: (
    side: "left" | "right",
    from: IAutoMovieMotionHumanFoot.IPlacement,
    to: IAutoMovieMotionHumanFoot.IPlacement,
  ) => (share: number) => IAutoMovieMotionHumanFoot.IPlacement,
): (side: "left" | "right", seconds: number) => {
  placement: IAutoMovieMotionHumanFoot.IPlacement;
  planted: boolean;
} {
  const intervals: Record<"left" | "right", {
    off: number;
    on: number;
    from: IAutoMovieMotionHumanFoot.IPlacement;
    progress: (seconds: number) => number;
    read: (share: number) => IAutoMovieMotionHumanFoot.IPlacement;
  }[]> = { left: [], right: [] };
  for (const side of ["left", "right"] as const)
    for (let i: number = 1; i < prints[side].length; i++) {
      const from: IAutoMovieMotionHumanFoot.IPlacement = prints[side][i - 1]!.print.placement;
      const step: number = prints[side][i]!.step;
      intervals[side].push({
        off: clock.at(`toeOff${step}`),
        on: clock.at(`treadContact${step}`),
        from,
        progress: AutoMovieMotionClock.prepare(clock, `toeOff${step}`, `treadContact${step}`).linear,
        read: swing(side, from, prints[side][i]!.print.placement),
      });
    }
  return (side: "left" | "right", seconds: number): {
    placement: IAutoMovieMotionHumanFoot.IPlacement;
    planted: boolean;
  } => {
    const own: (typeof intervals)["left"] = intervals[side];
    let low: number = 0;
    let high: number = own.length;
    while (low < high) {
      const middle: number = (low + high) >>> 1;
      if (seconds < own[middle]!.on) high = middle;
      else low = middle + 1;
    }
    const at: (typeof own)[number] | undefined = own[low];
    if (at === undefined)
      return { placement: prints[side].at(-1)!.print.placement, planted: true };
    if (seconds < at.off) return { placement: at.from, planted: true };
    return { placement: at.read(at.progress(seconds)), planted: false };
  };
}
