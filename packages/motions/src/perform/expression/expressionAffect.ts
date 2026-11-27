import type {
  IAutoMovieMotionHumanExpression,
  IAutoMovieMotionHumanLayer,
} from "@automovie/interface";

import { HumanAffect } from "./HumanAffect";

/*
 * The affect displays as one layer: each display added over the body at its
 * film second for its length, by HumanAffect.layer.
 * Parameter params: The displays.
 * Returns: The layer that adds the displays.
 * For a display whose length is not above the display's
 * floor (0 s, more for a sneeze or a gasp).
 */
export function expressionAffect(
  params: IAutoMovieMotionHumanExpression.IAffect,
): IAutoMovieMotionHumanLayer {
  return HumanAffect.layer(params.displays);
}
