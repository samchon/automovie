import type { IAutoMovieRecoveryChartSourcePiece } from "../../index";

/**
 * Native patch provenance qualified by its owning input chart.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identity of the input chart that generated this patch.
 * @evidence contracts/development/design.md#principled-representation Native patch provenance qualified by its owning input chart.
 * @evidence contracts/development/design.md#minimal-and-owned-surface assembleAutoMovieRecoveryFieldComplex share IAutoMovieRecoveryFieldComplexPiece's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryFieldComplexPiece extends IAutoMovieRecoveryChartSourcePiece {
  /** Identity of the input chart that generated this patch. */
  owningChart: string;
}
