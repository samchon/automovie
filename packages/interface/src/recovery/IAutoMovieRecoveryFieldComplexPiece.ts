import type { IAutoMovieRecoveryChartSourcePiece } from "..";

/** Native patch provenance qualified by its owning input chart. */

export interface IAutoMovieRecoveryFieldComplexPiece extends IAutoMovieRecoveryChartSourcePiece {
  /** Identity of the input chart that generated this patch. */
  owningChart: string;
}
