import type { IAutoMovieMotionClockPhase } from "@automovie/interface";

import { lieDown } from "./lieDown";

/*
 * The lie's clock phases: getting down, each route key's arrival but the last,
 * the last key's arrival with no time of its own, and the settled hold.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `phases`.
 */
export function lieDownPhases(
  prepared: lieDownPhases.IPrepared,
): IAutoMovieMotionClockPhase[] {
  const { route, hold }: lieDownPhases.IPrepared = prepared;
  return [
    { name: "getDown", seconds: lieDown.PHASE },
    ...route
      .slice(0, -1)
      .map(([, event]) => ({ name: event, seconds: lieDown.PHASE })),
    { name: route.at(-1)![1], seconds: 0 },
    { name: "settled", seconds: hold },
  ];
}

/*
 * The `phases` of `lieDown.plan`, built from what that plan prepared.
 */
export namespace lieDownPhases {
  /*
   * What `lieDown.plan` prepared for its `phases`.
   */
  export interface IPrepared {
    /*
     * The `route` `lieDown.plan` prepared.
     */
    route: readonly [string, string][];

    /*
     * The `hold` `lieDown.plan` prepared.
     */
    hold: number;
  }
}
