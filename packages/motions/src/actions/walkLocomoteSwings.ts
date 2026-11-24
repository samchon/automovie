import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieMotionHumanWalkSteps,
} from "@automovie/interface";

/**
 * Enumerate every swing of the schedule: the one landing in each stance that
 * begins after the start, read from the foot's schedule between that stance and
 * the one before it, so each carries the schedule's own toe-off and heel-strike
 * seconds.
 *
 * @param steps The walk's step schedule.
 * @returns The swings of both feet in toe-off order.
 */
export function walkLocomoteSwings(
  steps: Pick<IAutoMovieMotionHumanWalkSteps.IPlan, "foot" | "stances">,
): walkLocomoteSwings.ISwing[] {
  const swings: walkLocomoteSwings.ISwing[] = [];
  for (const side of ["left", "right"] as const) {
    let left: number = 0;
    for (const stance of steps.stances) {
      if (stance.side !== side) continue;
      if (stance.from > 0) {
        const swing: IAutoMovieMotionHumanWalkFoot.IScheduled["swing"] =
          steps.foot(side, (left + stance.from) / 2).swing;
        if (swing !== undefined)
          swings.push({ side, off: swing.off, on: swing.on });
      }
      left = stance.to;
    }
  }
  return swings.sort(
    (a: walkLocomoteSwings.ISwing, b: walkLocomoteSwings.ISwing): number =>
      a.off - b.off,
  );
}

/**
 * The swings of a walk's step schedule, enumerated once as the walk is planned
 * so every swing's constants are prepared before any second is read.
 */
export namespace walkLocomoteSwings {
  /** One foot's swing between two of its stances, action seconds. */
  export interface ISwing {
    /** The swinging foot. */
    side: AutoMovieHumanSide;

    /** Toe-off instant in action-local seconds. */
    off: number;

    /** Heel-strike instant in action-local seconds. */
    on: number;
  }
}
