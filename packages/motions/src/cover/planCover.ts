import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanCover,
} from "@automovie/interface";

import { coverBreach } from "./coverBreach";
import { coverPeek } from "./coverPeek";
import { coverTravel } from "./coverTravel";

/**
 * Plan a cover move by its kind: a peek past a wall's end, a sidle along its
 * face, a crouched pass under a window, or a breach of a door.
 *
 * @param context The action's context.
 * @returns The move's plan.
 * @throws {HumanRefusal} From the selected move when its geometry does not fit.
 */
export function planCover(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCover.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanCover.IParams = context.params;
  switch (p.kind) {
    case "peek":
      return coverPeek(context, p);
    case "sidle":
      return coverTravel.sidle(context, p);
    case "window":
      return coverTravel.window(context, p);
    case "breach":
      return coverBreach(context, p);
  }
}
