import type { IAutoMovieMotionHumanOperate } from "../next/IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanRelease } from "../throwing/IAutoMovieMotionHumanRelease";

/**
 * Open parameters of the boltAction lexicon family, keyed by each runtime export name: a bolt-action rifle's and a pistol's magazine handling of #3488.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The boltAction family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the boltAction row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
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
