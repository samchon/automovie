import type { IAutoMovieSimplexAtom } from "@automovie/engine";

import type { IAutoMovieRecoveryMapMetric } from "./IAutoMovieRecoveryMapMetric";

/**
 * Complete optional factor/row pair or explicit pre-return arithmetic absence.
 *
 * @evidence contracts/development/design.md#principled-representation Finite positive computed point and Schur pivots define a numerical SPD metric only after every fixed physical row whitens with it. Original rank, physical normal and actual gates remain separate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The camera linearizer consumes one matched metric/rows pair before return, or wholly whitens original rows with its existing GN factor after refusal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No partial rows, floor, altered damping, late GN substitution or caught core exception supplies a supported result.
 * @evidence contracts/development/common.md#meaningful-documentation Null members accompany an explicit formation, point-pivot, camera-pivot or whitening refusal. Supported rows and metric belong to the same fixed factor for its entire model lifetime.
 */
export interface IAutoMovieRecoveryMapCurvatureFit {
  /** Complete current numerical metric, or null when unsupported before return. */
  metric: IAutoMovieRecoveryMapMetric | null;

  /** Complete matching whitened original rows, or null on any refusal. */
  rows: IAutoMovieSimplexAtom[] | null;

  /** Latest optional arithmetic stage; null denotes supported numerical use. */
  reason:
    | "local-formation"
    | "point-pivot"
    | "camera-pivot"
    | "row-whitening"
    | null;
}
