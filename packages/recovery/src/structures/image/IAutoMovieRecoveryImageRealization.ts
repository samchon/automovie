import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieRecoveryConstructionLine } from "../curve/IAutoMovieRecoveryConstructionLine";

/**
 * Source-free model, coefficient-derived construction and circular-to-cubic approximation bound.
 *
 * @evidence contracts/common.md#principled-implementation The model and construction derive from the same saved section coefficients and carry the circular-to-cubic approximation bound.
 * @evidence contracts/common.md#clear-and-simple-design Source-free surface data, generating lines and the arc approximation bound travel together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The arc bound does not include image fit, downstream tessellation error or unobserved surfaces.
 * @evidence contracts/common.md#meaningful-documentation States model and construction units, shared coefficient authority and the metre arc bound.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data remain caller-owned.
 */
export interface IAutoMovieRecoveryImageRealization {
  /** Source-free generated model, in model metres. */
  model: IAutoMovieModel;

  /** Lines evaluated from the same generating coefficients. */
  construction: IAutoMovieRecoveryConstructionLine[];

  /** Circular-to-cubic approximation bound, metres. */
  arcDeviationBoundMeters: number;
}
