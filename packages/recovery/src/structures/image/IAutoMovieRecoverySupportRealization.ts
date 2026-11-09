import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieRecoveryConstructionLine } from "../curve/IAutoMovieRecoveryConstructionLine";
import type { IAutoMovieRecoverySupportRealizationMetrics } from "./IAutoMovieRecoverySupportRealizationMetrics";

/**
 * Source-free convex-support model, construction and numerical generation diagnostics.
 *
 * @evidence contracts/development/design.md#principled-representation The generated model, construction and numerical metrics consume the same source-free support coefficients.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Geometry and its generating lines share one realization report and independent numerical qualifications.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite generated geometry does not supply unobserved caps, interiors or certified enclosure.
 * @evidence contracts/development/common.md#meaningful-documentation States model metre units, shared construction authority and the scope of generation metrics.
 */
export interface IAutoMovieRecoverySupportRealization {
  /** Source-free generated model, in model metres. */
  model: IAutoMovieModel;

  /** Lines evaluated from the same generating coefficients. */
  construction: IAutoMovieRecoveryConstructionLine[];

  /** Actual numerical generation counts and qualifications. */
  generation: IAutoMovieRecoverySupportRealizationMetrics;
}
