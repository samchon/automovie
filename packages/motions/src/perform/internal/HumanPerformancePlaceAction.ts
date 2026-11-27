import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPlacedAction,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * An action's reader of the anchored actions placed before it
 * (`HumanPerformancePlace.place`). An anchored action a later part of an open
 * group holds is placed first (`IAutoMovieScheduleContext.demandAnchor`), as a
 * read of a person is.
 * Parameter self: The performance's state.
 * Parameter named: The parameter through which the reading action named an id.
 * Returns: The reader of an anchored action.
 * When a read anchor is not placed earlier in the
 * composition.
 */
export function HumanPerformancePlaceAction(
  self: IAutoMovieMotionHumanPerformanceState,
  named: (id: string, otherwise: string) => string,
): (anchor: string) => IAutoMovieMotionHumanPlacedAction {
  return (anchor: string): IAutoMovieMotionHumanPlacedAction => {
    let placed = self.anchors.get(anchor);
    if (placed === undefined && self.demandAnchor?.(anchor) === "placed")
      placed = self.anchors.get(anchor);
    if (placed === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: named(anchor, "anchor"),
        value: anchor,
        feasible: {
          kind: "alternatives",
          values: [...self.anchors.keys()],
        },
        reason: `the action anchored ${anchor} is not placed earlier in the composition`,
        fix: `give the answered action the anchor ${anchor} and compose it before self one`,
      });
    return {
      subject: placed.subject,
      name: placed.name,
      family: placed.law.family ?? placed.name,
      params: placed.params,
      plan: placed.plan,
      start: placed.start,
      entryTime: placed.entryTime,
      end: placed.end,
    };
  };
}
