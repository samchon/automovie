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
