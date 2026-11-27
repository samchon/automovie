import type { IAutoMovieRecoveryEventCurveSource } from "..";

/** One restricted cubic with a positive width in its enclosing chart. */
export interface IAutoMovieRecoveryEventCurvePiece {
  /** Positive phase interval width. */
  width: number;

  /** Original native coefficient authority. */
  source: IAutoMovieRecoveryEventCurveSource;
}
