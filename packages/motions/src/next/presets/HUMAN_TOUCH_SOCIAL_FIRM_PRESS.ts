import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";

/*
 * The values the `firmPress` row of `HumanSocial` fixes on `touch`, spread into
 * its parameters. A firm, slow pat or press of the palm on the partner (Laban's
 * press: strong, sustained, direct); the composition gives the region. The
 * press takes 0.4 s and holds 1.2 s (`touch`'s defaults, provisional);
 * steadying, emphasis.
 */
export const HUMAN_TOUCH_SOCIAL_FIRM_PRESS: IAutoMovieMotionHumanTouch.ITouchEffectorKindMannerPreset =
  {
    effector: "palm",
    kind: "press",
    manner: AutoMovieMotionManner.PRESETS.press,
  };
