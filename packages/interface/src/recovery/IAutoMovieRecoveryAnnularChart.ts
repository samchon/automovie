import type { IAutoMovieRecoveryEventChart } from "..";

/** Two closed paths joined by one shared periodic seam arc. */

export interface IAutoMovieRecoveryAnnularChart extends IAutoMovieRecoveryEventChart {
  /** Left and right reference the same seam occurrence authority. */
  periodic: true;
}
