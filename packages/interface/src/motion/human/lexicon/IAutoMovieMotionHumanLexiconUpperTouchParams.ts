import type { IAutoMovieMotionHumanSelfAction } from "../touch/IAutoMovieMotionHumanSelfAction";
import type { IAutoMovieMotionHumanTouch } from "../touch/IAutoMovieMotionHumanTouch";
import type { AutoMovieMotionHumanTuckHairParams } from "./AutoMovieMotionHumanTuckHairParams";

/**
 * Open parameters of the upperTouch lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before planning or resolving a row's fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The upperTouch family is a closed export-name map. Each key uses the law contract directly or projects its open parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the upperTouch row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
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
