import type { IAutoMovieMotionHumanOperate } from "./IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanRelease } from "./IAutoMovieMotionHumanRelease";

/**
 * Open parameters of the boltAction lexicon family, keyed by each runtime
 * export name: a bolt-action rifle's and a pistol's magazine handling.
 */
export interface IAutoMovieMotionHumanLexiconBoltActionParams {
  /** Lift the bolt handle. */
  liftBolt: IAutoMovieMotionHumanOperate.IParams;

  /** Draw the bolt back. */
  drawBolt: IAutoMovieMotionHumanOperate.IParams;

  /** Run the bolt forward. */
  closeBolt: IAutoMovieMotionHumanOperate.IParams;

  /** Turn the bolt handle down. */
  lowerBolt: IAutoMovieMotionHumanOperate.IParams;

  /** Seat a magazine in its well. */
  seatMagazine: IAutoMovieMotionHumanOperate.IParams;

  /** Press the magazine release. */
  pressRelease: IAutoMovieMotionHumanOperate.IParams;

  /** Let the empty magazine drop. */
  dropMagazine: IAutoMovieMotionHumanRelease.IParams;
}
