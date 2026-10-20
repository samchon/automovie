import type { IAutoMovieRecoverySupportLoft } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryImageFitCounts } from "./IAutoMovieRecoveryImageFitCounts";
import type { IAutoMovieRecoveryImageSource } from "./IAutoMovieRecoveryImageSource";
import type { IAutoMovieRecoverySupportGeneration } from "./IAutoMovieRecoverySupportGeneration";

/**
 * Fit evidence kept outside compact support-coefficient generation authority.
 * Pixel residuals include the implied intersection's support, not only each
 * independently fitted offset. Numerical event and mesh counts qualify the
 * selected representation; they do not observe hidden physical topology.
 *
 * @evidence contracts/common.md#principled-implementation The saved coefficient field, all source identities, common interval, actual support residual and engine event diagnostics expose separate acquisition, fitting and generation facts.
 * @evidence contracts/common.md#clear-and-simple-design One fit report transfers compact generation data and independent evidence without making source rows a generation dependency.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No successful fit or event count certifies enclosure, cameras, true convexity, hidden concavity or unseen caps/interior.
 * @evidence contracts/common.md#meaningful-documentation States residual scope, cohort separation, free-scalar count, numerical event qualification and explicit unknown physical regions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result record performs no numerical traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type defines no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Arrays belong to the caller and retain no image, file handle or process.
 */
export interface IAutoMovieRecoverySupportFit {
  /** Independently generative coefficients and edit/coverage metadata. */
  recipe: IAutoMovieRecoverySupportLoft;

  /** Analytic, photographic and inconsistent-input evidence remain distinct. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /** Every training source identity; camera charts remain in the observation artifact. */
  sources: IAutoMovieRecoveryImageSource[];

  /** Maximum pixel residual of fitted offsets or their implied polygon supports. */
  maximumResidualPx: number;

  /** Selected unpivoted Householder diagonal ratio; not a certified condition. */
  splineRankRatio: number;

  /** Corresponding rows, longitudinal spans and fitted scalar spline coefficients. */
  counts: IAutoMovieRecoveryImageFitCounts;

  /** Common measured row-centre interval, in millimetres. */
  observedIntervalMm: [number, number];

  /** Actual selected engine event/interval/mesh counts and numerical boundary defect. */
  generation: IAutoMovieRecoverySupportGeneration;
}
