import type { IAutoMovieMotionTrajectoryPartition } from "@automovie/interface";

/*
 * Own the exact time partition reused by integrations over one unchanged
 * physical history. A new interval follows the controller's actual proposal; a
 * rejected interval is bisected down to the controller's proposed reduction.
 * Subsequent trials replay those same numeric endpoints and still perform every
 * local and dense physical error check. No state, rate or admitted error is
 * reused.
 * Parameter t0: The finite first second.
 * Parameter t1: The finite last second, after t0.
 * Returns: Operation-owned interval lookup, rejection refinement and release.
 * For an invalid interval or a lookup outside its owned span.
 */
export function MotionTrajectoryPartition(
  t0: number,
  t1: number,
): MotionTrajectoryPartition.IPartition {
  if (!(t1 > t0))
    throw new Error(
      "A reusable trajectory partition needs a finite forward interval",
    );
  const ends: Map<number, number> = new Map();
  return {
    end: (start: number, proposed: number): number => {
      if (!(start >= t0 && start < proposed && proposed <= t1))
        throw new Error(
          "A trajectory partition query must lie inside its interval",
        );
      const known: number | undefined = ends.get(start);
      if (known !== undefined) return known;
      ends.set(start, proposed);
      return proposed;
    },
    split: (start: number, maximumStep?: number): boolean => {
      let end: number | undefined = ends.get(start);
      if (end === undefined) return false;
      const limit: number = maximumStep ?? (end - start) / 2;
      if (!(limit > 0 && limit < end - start)) return false;
      do {
        const middle: number = start + (end - start) / 2;
        if (!(start < middle && middle < end)) return false;
        ends.set(start, middle);
        ends.set(middle, end);
        end = middle;
      } while (end - start > limit);
      return true;
    },
    clear: (): void => ends.clear(),
  };
}

/*
 * The mutable time-mesh owner passed only between one shooting solve's trials.
 */
export namespace MotionTrajectoryPartition {
  /*
   * The interface contract (`IAutoMovieMotionTrajectoryPartition.IPartition`).
   */
  export type IPartition = IAutoMovieMotionTrajectoryPartition.IPartition;
}
