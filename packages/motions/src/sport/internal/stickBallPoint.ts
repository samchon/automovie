import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Get a working point from the authored model, or report the missing point.
 */
export function stickBallPoint(
  reader: IAutoMovieMotionHumanPropReader,
  id: string,
): IAutoMovieAffordance {
  const match: IAutoMovieAffordance | undefined = reader.prop.affordances?.find(
    (value) => value.id === id,
  );
  if (match === undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "stick",
      value: reader.prop.subject,
      reason: `${reader.prop.subject} does not declare the ${id} affordance`,
      fix: "give the working stick and ball the sport's archetype affordances",
    });
  return match;
}
