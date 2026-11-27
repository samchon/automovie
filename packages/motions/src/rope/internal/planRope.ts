import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanRope,
} from "@automovie/interface";

import { ropeSupport } from "./ropeSupport";
import { ropeSwing } from "./ropeSwing";
import { ropeTraverse } from "./ropeTraverse";

/*
 * Plan a rope crossing by its kind: a climb or a descent of an upright rope, a
 * traverse of a level one, or a swing to a landing.
 * Parameter context: The action's context.
 * Returns: The crossing's plan.
 * From the selected crossing when the rope cannot carry
 * it.
 */
export function planRope(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRope.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanRope.IParams = context.params;
  switch (p.kind) {
    case "climb":
    case "descend":
      return ropeSupport.upright(context, p);
    case "traverse":
      return ropeTraverse(context, p);
    case "swing":
      return ropeSwing(context, p);
  }
}
