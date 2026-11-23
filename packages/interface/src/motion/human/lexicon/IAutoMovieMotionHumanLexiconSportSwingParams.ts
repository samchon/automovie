import type { IAutoMovieMotionHumanLexiconPrecisionSportParams } from "./IAutoMovieMotionHumanLexiconPrecisionSportParams";
import type { IAutoMovieMotionHumanSword } from "./IAutoMovieMotionHumanSword";
import type { IAutoMovieMotionHumanSwordGuard } from "./IAutoMovieMotionHumanSwordGuard";

/**
 * Open parameters of the sportSwing lexicon family, keyed by each runtime
 * export name.
 */
export interface IAutoMovieMotionHumanLexiconSportSwingParams extends IAutoMovieMotionHumanLexiconPrecisionSportParams {
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

  /**
   * A serve, a smash or a badminton clear: the racket brought down from
   * overhead.
   */
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
