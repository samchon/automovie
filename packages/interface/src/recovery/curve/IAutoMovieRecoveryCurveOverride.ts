import type { IAutoMovieCurve64 } from "../../index";

/**
 * A named replacement cubic and its separate numerical observation-fit estimate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Finite continuous millimetre cubic retaining its original closure and phase. Nonnegative numerical PL-data upper estimate in millimetres.
 * @evidence contracts/development/design.md#principled-representation Finite continuous millimetre cubic retaining its original closure and phase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryAnalyticPublication share IAutoMovieRecoveryCurveOverride's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryCurveOverride {
  /** Finite continuous millimetre cubic retaining its original closure and phase. */
  curve: IAutoMovieCurve64.Cubic;

  /** Nonnegative numerical PL-data upper estimate in millimetres. */
  dataUpperEstimateMm: number;
}
