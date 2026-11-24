import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import { prepareHumanPerformanceOrder } from "./prepareHumanPerformanceOrder";

/**
 * Solve every placed plan on the performance as it is placed now
 * (`IAutoMovieMotionHumanActionPlan.prepare`), actions and overlays alike, each
 * after the plans it reads (`prepareHumanPerformanceOrder`). The performance
 * runs it once every action is placed and again whenever what a plan reads
 * changes: a committed or withdrawn stop, a resolved flight.
 *
 * @param self The placed performance.
 */
export function prepareHumanPerformancePlans(
  self: IAutoMovieMotionHumanPerformanceState,
): void {
  prepareHumanPerformanceOrder(
    self.people.values(),
    (
      person: IAutoMovieMotionHumanSegment.IPerson,
    ): readonly IAutoMovieMotionHumanSegment[] => [
      ...person.segments,
      ...person.overlays,
    ],
    (
      _person: IAutoMovieMotionHumanSegment.IPerson,
      segment: IAutoMovieMotionHumanSegment,
    ): void => segment.plan.prepare?.(),
  );
}
