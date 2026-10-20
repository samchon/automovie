import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieRecoveryConstructionLine } from "../curve/IAutoMovieRecoveryConstructionLine";
import type { IAutoMovieRecoverySupportRealizationMetrics } from "./IAutoMovieRecoverySupportRealizationMetrics";

/**
 * Source-free convex-support model, construction and numerical generation diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation The generated model, construction and numerical metrics consume the same source-free support coefficients.
 * @evidence contracts/common.md#clear-and-simple-design Geometry and its generating lines share one realization report and independent numerical qualifications.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite generated geometry does not supply unobserved caps, interiors or certified enclosure.
 * @evidence contracts/common.md#meaningful-documentation States model metre units, shared construction authority and the scope of generation metrics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data remain caller-owned.
 */
export interface IAutoMovieRecoverySupportRealization {
  /** Source-free generated model, in model metres. */
  model: IAutoMovieModel;

  /** Lines evaluated from the same generating coefficients. */
  construction: IAutoMovieRecoveryConstructionLine[];

  /** Actual numerical generation counts and qualifications. */
  generation: IAutoMovieRecoverySupportRealizationMetrics;
}
