import type { IAutoMovieRecoveryChartSourcePiece } from "./IAutoMovieRecoveryChartSourcePiece";

/**
 * Native patch provenance qualified by its owning input chart.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 */
export interface IAutoMovieRecoveryFieldComplexPiece extends IAutoMovieRecoveryChartSourcePiece {
  /** Identity of the input chart that generated this patch. */
  owningChart: string;
}
