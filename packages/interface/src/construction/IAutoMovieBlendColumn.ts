import type { IAutoMovieBlendCrossJet } from "./IAutoMovieBlendCrossJet";

/**
 * Paired boundary ribbons of one blend column, oriented in increasing cross
 * share.
 */
export interface IAutoMovieBlendColumn {
  /**
   * Start boundary at cross share zero, with derivatives toward increasing
   * share.
   */
  start: IAutoMovieBlendCrossJet;

  /** End boundary at cross share one, with the same derivative orientation. */
  end: IAutoMovieBlendCrossJet;
}
