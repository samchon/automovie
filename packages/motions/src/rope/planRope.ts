import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanRope,
} from "@automovie/interface";

import { ropeSupport } from "./ropeSupport";
import { ropeSwing } from "./ropeSwing";
import { ropeTraverse } from "./ropeTraverse";

/**
 * Plan a rope crossing by its kind: a climb or a descent of an upright rope,
 * a traverse of a level one, or a swing to a landing.
 *
 * @param context The action's context.
 * @returns The crossing's plan.
 * @throws {HumanRefusal} From the selected crossing when the rope cannot carry it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the dispatch and the refusal owner.
 * @evidence contracts/development/implementation.md#principled-implementation Each crossing is planned by its own module over the named rope.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One dispatch on the discriminant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No variant is special-cased beyond its kind.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant dispatch.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Plans once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only the selected plan.
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
