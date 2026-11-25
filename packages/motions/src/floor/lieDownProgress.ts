import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockPhase,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";

/**
 * Each route phase's prepared progress on the clock
 * (`AutoMovieMotionClock.prepare`), from its phase to the next.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `progress`.
 */
export function lieDownProgress(
  prepared: lieDownProgress.IPrepared,
): ReturnType<typeof AutoMovieMotionClock.prepare>[] {
  const { route, clock, phases }: lieDownProgress.IPrepared = prepared;
  return route.map(
    (
      _: unknown,
      index: number,
    ): ReturnType<typeof AutoMovieMotionClock.prepare> =>
      AutoMovieMotionClock.prepare(
        clock,
        phases[index]!.name,
        phases[index + 1]!.name,
      ),
  );
}

/** The `progress` of `lieDown.plan`, built from what that plan prepared. */
export namespace lieDownProgress {
  /** What `lieDown.plan` prepared for its `progress`. */
  export interface IPrepared {
    /** The `route` `lieDown.plan` prepared. */
    route: readonly [string, string][];

    /** The `clock` `lieDown.plan` prepared. */
    clock: IAutoMovieMotionClock;

    /** The `phases` `lieDown.plan` prepared. */
    phases: IAutoMovieMotionClockPhase[];
  }
}
