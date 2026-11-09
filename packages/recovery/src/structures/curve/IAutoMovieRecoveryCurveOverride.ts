import type { IAutoMovieCurve64 } from "@automovie/engine";

/**
 * A named replacement cubic and its separate numerical observation-fit estimate.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 */
export interface IAutoMovieRecoveryCurveOverride {
  /** Finite continuous millimetre cubic retaining its original closure and phase. */
  curve: IAutoMovieCurve64.Cubic;

  /** Nonnegative numerical PL-data upper estimate in millimetres. */
  dataUpperEstimateMm: number;
}
