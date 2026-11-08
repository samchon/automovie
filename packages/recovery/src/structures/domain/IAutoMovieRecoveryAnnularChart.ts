import type { IAutoMovieRecoveryEventChart } from "./IAutoMovieRecoveryEventChart";

/**
 * Two closed paths joined by one shared periodic seam arc.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 */
export interface IAutoMovieRecoveryAnnularChart extends IAutoMovieRecoveryEventChart {
  /** Left and right reference the same seam occurrence authority. */
  periodic: true;
}
