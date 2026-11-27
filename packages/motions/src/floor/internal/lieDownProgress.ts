import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockPhase,
} from "@automovie/interface";

import { motionClock } from "../../compose/internal/motionClock";

/*
 * Each route phase's prepared progress on the clock
 * (`motionClock.prepare`), from its phase to the next.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `progress`.
 */
export function lieDownProgress(
  prepared: lieDownProgress.IPrepared,
): ReturnType<typeof motionClock.prepare>[] {
  const { route, clock, phases }: lieDownProgress.IPrepared = prepared;
  return route.map(
    (
      _: unknown,
      index: number,
    ): ReturnType<typeof motionClock.prepare> =>
      motionClock.prepare(
        clock,
        phases[index]!.name,
        phases[index + 1]!.name,
      ),
  );
}

/*
 * The `progress` of `lieDown.plan`, built from what that plan prepared.
 */
export namespace lieDownProgress {
  /*
   * What `lieDown.plan` prepared for its `progress`.
   */
  export interface IPrepared {
    /*
     * The `route` `lieDown.plan` prepared.
     */
    route: readonly [string, string][];

    /*
     * The `clock` `lieDown.plan` prepared.
     */
    clock: IAutoMovieMotionClock;

    /*
     * The `phases` `lieDown.plan` prepared.
     */
    phases: IAutoMovieMotionClockPhase[];
  }
}
