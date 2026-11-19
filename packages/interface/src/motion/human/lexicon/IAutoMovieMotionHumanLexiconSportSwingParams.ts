import type { IAutoMovieMotionHumanLexiconPrecisionSportParams } from "./IAutoMovieMotionHumanLexiconPrecisionSportParams";
import type { IAutoMovieMotionHumanSword } from "./IAutoMovieMotionHumanSword";
import type { IAutoMovieMotionHumanSwordGuard } from "./IAutoMovieMotionHumanSwordGuard";

/**
 * Open parameters of the sportSwing lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The sportSwing family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the sportSwing row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconSportSwingParams
  extends IAutoMovieMotionHumanLexiconPrecisionSportParams {
  /** A baseball swing: both hands, level from the bat hand's side. */
  batSwing: Omit<IAutoMovieMotionHumanSword.ICut, "from" | "hands">;

  /** A checked swing: the bat started and held back at half its path. */
  checkSwing: Omit<IAutoMovieMotionHumanSword.ICut, "from" | "hands" | "feint">;

  /** A bunt: the bat held level before the body in both hands. */
  bunt: Omit<IAutoMovieMotionHumanSwordGuard.IParams, "guard" | "hands">;

  /** A forehand drive of tennis, squash or table tennis. */
  forehand: Omit<IAutoMovieMotionHumanSword.ICut, "from">;

  /** A one-handed backhand drive. */
  backhandDrive: Omit<IAutoMovieMotionHumanSword.ICut, "from">;

  /** A two-handed backhand drive. */
  twoHandBackhand: Omit<IAutoMovieMotionHumanSword.ICut, "from" | "hands">;

  /** A topspin stroke: the racket brushed up from below the ball. */
  topspin: Omit<IAutoMovieMotionHumanSword.ICut, "from">;

  /** A serve, a smash or a badminton clear: the racket brought down from overhead. */
  overheadSmash: Omit<IAutoMovieMotionHumanSword.ICut, "from">;

  /** A volley: a short punch of the racket from high on its own side. */
  volley: Omit<IAutoMovieMotionHumanSword.ICut, "from">;

  /** A full golf swing: both hands, down from above the rear shoulder. */
  golfSwing: Omit<IAutoMovieMotionHumanSword.ICut, "from" | "hands">;

  /** A golf putt or chip: both hands, a level stroke along the ground line. */
  putt: Omit<IAutoMovieMotionHumanSword.ICut, "from" | "hands">;

  /** A volleyball spike or serve: the open hand brought down from overhead. */
  spike: Omit<IAutoMovieMotionHumanSword.ICut, "from">;
}
