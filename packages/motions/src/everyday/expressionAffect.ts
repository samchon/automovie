import type {
  IAutoMovieMotionHumanExpression,
  IAutoMovieMotionHumanLayer,
} from "@automovie/interface";

import { HumanAffect } from "./HumanAffect";

/**
 * The affect displays as one layer: each display added over the body at its
 * film second for its length, by {@link HumanAffect.layer}.
 *
 * @param params The displays.
 * @returns The layer that adds the displays.
 * @throws {HumanRefusal} For a display whose length is not above the display's floor (0 s, more for a sneeze or a gasp).
 *
 * @evidence contracts/development/design.md#principled-representation The display angles and lengths are `HumanAffect`'s; this reader only names its parameter.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader, `AutoMovieMotionHumanExpression.affect`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the display type `IAutoMovieMotionHumanAffect` owns.
 */
export function expressionAffect(
  params: IAutoMovieMotionHumanExpression.IAffect,
): IAutoMovieMotionHumanLayer {
  return HumanAffect.layer(params.displays);
}
