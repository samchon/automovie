import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

import { AutoMovieMotionManner } from "../../compose/AutoMovieMotionManner";

/**
 * The values the `firmPress` row of `HumanSocial` fixes on `touch`, spread into
 * its parameters. A firm, slow pat or press of the palm on the partner (Laban's
 * press: strong, sustained, direct); the composition gives the region. The
 * press takes 0.4 s and holds 1.2 s (`touch`'s defaults, provisional);
 * steadying, emphasis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `ITouchEffectorKindMannerPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanTouch.SOCIAL_FIRM_PRESS`; the `firmPress` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_TOUCH_SOCIAL_FIRM_PRESS: IAutoMovieMotionHumanTouch.ITouchEffectorKindMannerPreset =
  {
    effector: "palm",
    kind: "press",
    manner: AutoMovieMotionManner.PRESETS.press,
  };
