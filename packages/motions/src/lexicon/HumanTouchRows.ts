import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_TOUCH_HOLD } from "../next/presets/HUMAN_TOUCH_HOLD";
import { HUMAN_TOUCH_PAT } from "../next/presets/HUMAN_TOUCH_PAT";
import { HUMAN_TOUCH_PRESS } from "../next/presets/HUMAN_TOUCH_PRESS";
import { HUMAN_TOUCH_RUB } from "../next/presets/HUMAN_TOUCH_RUB";
import { HUMAN_TOUCH_SCRATCH } from "../next/presets/HUMAN_TOUCH_SCRATCH";
import { HUMAN_TOUCH_SQUEEZE } from "../next/presets/HUMAN_TOUCH_SQUEEZE";
import { HUMAN_TOUCH_STROKE } from "../next/presets/HUMAN_TOUCH_STROKE";
import { HUMAN_TOUCH_TAP } from "../next/presets/HUMAN_TOUCH_TAP";
import { touch } from "../touch/touch";

/**
 * The contact strokes as rows: each kind of `touch` under a name of its own,
 * the site, the effector, the side and the target open, so one row serves every
 * site.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and
 * is checked as the law is, and its draws are keyed by its own name. The rows
 * over the arm's phrases themselves are `HumanUpperRows`.
 */
export namespace HumanTouchRows {
  /**
   * `touch` of kind `tap`: 3 taps of 0.3 s, then 0.4 s on the place, in all 1.3
   * s after the reach; a light attention-getting touch on a shoulder or an arm
   * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
   * provisional except the stroke).
   */
  export const touchTap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchTap"]
  > = AutoMovieMotionHumanActionRow.of("touchTap", touch, HUMAN_TOUCH_TAP);

  /**
   * `touch` of kind `pat`: 3 pats of 0.4 s, then 0.4 s, 1.6 s after the reach;
   * comfort, praise, a friendly pat
   * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
   * provisional except the stroke).
   */
  export const touchPat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchPat"]
  > = AutoMovieMotionHumanActionRow.of("touchPat", touch, HUMAN_TOUCH_PAT);

  /**
   * `touch` of kind `stroke`: one stroke at a 5 cm/s peak (the pleasant-touch
   * rate, Loken et al. 2009), about 5 s for a 0.2 m hand, then 0.4 s; a caress,
   * soothing ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold`
   * override; provisional except the stroke).
   */
  export const touchStroke: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchStroke"]
  > = AutoMovieMotionHumanActionRow.of(
    "touchStroke",
    touch,
    HUMAN_TOUCH_STROKE,
  );

  /**
   * `touch` of kind `rub`: 3 rubs of 0.5 s, then 0.4 s, 1.9 s after the reach;
   * warming, soothing, rubbing a shoulder or a back
   * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
   * provisional except the stroke).
   */
  export const touchRub: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchRub"]
  > = AutoMovieMotionHumanActionRow.of("touchRub", touch, HUMAN_TOUCH_RUB);

  /**
   * `touch` of kind `press`: one press of 0.4 s, then held 1.2 s, 1.6 s after
   * the reach; a firm touch, pushing a button on a person, steadying
   * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
   * provisional except the stroke).
   */
  export const touchPress: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchPress"]
  > = AutoMovieMotionHumanActionRow.of("touchPress", touch, HUMAN_TOUCH_PRESS);

  /**
   * `touch` of kind `squeeze`: one squeeze of 0.4 s with the fingers curled 20
   * degrees, held 1.2 s, 1.6 s after the reach; reassurance, a grip on an arm
   * or a hand ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold`
   * override; provisional except the stroke).
   */
  export const touchSqueeze: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchSqueeze"]
  > = AutoMovieMotionHumanActionRow.of(
    "touchSqueeze",
    touch,
    HUMAN_TOUCH_SQUEEZE,
  );

  /**
   * `touch` of kind `hold`: one placement of 0.4 s, then held 1.2 s, 1.6 s
   * after the reach; a hand laid on a shoulder or an arm
   * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
   * provisional except the stroke).
   */
  export const touchHold: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchHold"]
  > = AutoMovieMotionHumanActionRow.of("touchHold", touch, HUMAN_TOUCH_HOLD);

  /**
   * `touch` of kind `scratch`: 3 scratches of 0.2 s with curled fingers, then
   * 0.4 s, 1.0 s after the reach; an itch, scratching the head or an arm
   * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
   * provisional except the stroke).
   */
  export const touchScratch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchScratch"]
  > = AutoMovieMotionHumanActionRow.of(
    "touchScratch",
    touch,
    HUMAN_TOUCH_SCRATCH,
  );
}
