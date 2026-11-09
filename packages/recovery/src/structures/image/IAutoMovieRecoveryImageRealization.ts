import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieRecoveryConstructionLine } from "../curve/IAutoMovieRecoveryConstructionLine";

/**
 * Source-free model, coefficient-derived construction and circular-to-cubic approximation bound.
 *
 * @evidence contracts/development/design.md#principled-representation The model and construction derive from the same saved section coefficients and carry the circular-to-cubic approximation bound.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Source-free surface data, generating lines and the arc approximation bound travel together.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The arc bound does not include image fit, downstream tessellation error or unobserved surfaces.
 * @evidence contracts/development/common.md#meaningful-documentation States model and construction units, shared coefficient authority and the metre arc bound.
 */
export interface IAutoMovieRecoveryImageRealization {
  /** Source-free generated model, in model metres. */
  model: IAutoMovieModel;

  /** Lines evaluated from the same generating coefficients. */
  construction: IAutoMovieRecoveryConstructionLine[];

  /** Circular-to-cubic approximation bound, metres. */
  arcDeviationBoundMeters: number;
}
