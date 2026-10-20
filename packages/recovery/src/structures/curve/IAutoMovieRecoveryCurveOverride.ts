import type { IAutoMovieCurve64 } from "@automovie/engine/geometry/curve";

/**
 * A named replacement cubic and its separate numerical observation-fit estimate.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/common.md#clear-and-simple-design One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records remain caller-owned and acquire no external resources.
 */
export interface IAutoMovieRecoveryCurveOverride {
  /** Finite continuous millimetre cubic retaining its original closure and phase. */
  curve: IAutoMovieCurve64.Cubic;

  /** Nonnegative numerical PL-data upper estimate in millimetres. */
  dataUpperEstimateMm: number;
}
