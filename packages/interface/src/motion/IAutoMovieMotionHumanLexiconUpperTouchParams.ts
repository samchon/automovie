import type { IAutoMovieMotionHumanTouch } from "./IAutoMovieMotionHumanTouch";
import type { IAutoMovieMotionHumanSelfAction } from "./IAutoMovieMotionHumanSelfAction";
import type { AutoMovieMotionHumanTuckHairParams } from "./AutoMovieMotionHumanTuckHairParams";

/**
 * Open parameters of the upperTouch lexicon family, keyed by each runtime
 * export name.
 */
export interface IAutoMovieMotionHumanLexiconUpperTouchParams {
  /** `touch` of kind `tap`. */
  touchTap: Omit<IAutoMovieMotionHumanTouch.IParams, "kind">;

  /** `touch` of kind `pat`. */
  touchPat: Omit<IAutoMovieMotionHumanTouch.IParams, "kind">;

  /** `touch` of kind `stroke`. */
  touchStroke: Omit<IAutoMovieMotionHumanTouch.IParams, "kind">;

  /** `touch` of kind `rub`. */
  touchRub: Omit<IAutoMovieMotionHumanTouch.IParams, "kind">;

  /** `touch` of kind `press`. */
  touchPress: Omit<IAutoMovieMotionHumanTouch.IParams, "kind">;

  /** `touch` of kind `squeeze`. */
  touchSqueeze: Omit<IAutoMovieMotionHumanTouch.IParams, "kind">;

  /** `touch` of kind `hold`. */
  touchHold: Omit<IAutoMovieMotionHumanTouch.IParams, "kind">;

  /** `touch` of kind `scratch`. */
  touchScratch: Omit<IAutoMovieMotionHumanTouch.IParams, "kind">;

  /** `selfAction` of kind `stretch`. */
  selfStretch: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;

  /** `selfAction` of kind `victory`. */
  selfVictory: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;

  /** `selfAction` of kind `fistPump`. */
  selfFistPump: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;

  /** `selfAction` of kind `neckRoll`. */
  selfNeckRoll: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;

  /** `selfAction` of kind `shoulderRoll`. */
  selfShoulderRoll: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;

  /** Sweep hair behind an ear. */
  tuckHair: AutoMovieMotionHumanTuckHairParams;
}
