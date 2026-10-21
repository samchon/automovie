import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";

import type { IAutoMovieRecoveryMapMetric } from "./IAutoMovieRecoveryMapMetric";

/**
 * Complete optional factor/row pair or explicit pre-return arithmetic absence.
 *
 * @evidence contracts/common.md#principled-implementation Finite positive computed point and Schur pivots define a numerical SPD metric only after every fixed physical row whitens with it. Original rank, physical normal and actual gates remain separate.
 * @evidence contracts/common.md#clear-and-simple-design The camera linearizer consumes one matched metric/rows pair before return, or wholly whitens original rows with its existing GN factor after refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No partial rows, floor, altered damping, late GN substitution or caught core exception supplies a supported result.
 * @evidence contracts/common.md#meaningful-documentation Null members accompany an explicit formation, point-pivot, camera-pivot or whitening refusal. Supported rows and metric belong to the same fixed factor for its entire model lifetime.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no factorization.
 * @evidence contracts/performance.md#reuse-equivalent-work A supported pair reuses the single admitted optional factor; no second factor/model/trial follows a refusal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a supported current factor and complete owned rows transfer. Refused partial arrays expire, while the conservative admitted reservation remains unrefunded.
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
