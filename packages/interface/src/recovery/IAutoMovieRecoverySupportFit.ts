import type {
  IAutoMovieRecoveryImageFitCounts,
  IAutoMovieRecoveryImageSource,
  IAutoMovieRecoverySupportGeneration,
  IAutoMovieRecoverySupportLoft,
} from "..";

/**
 * Fit evidence kept outside compact support-coefficient generation authority.
 * Pixel residuals include the implied intersection's support, not only each
 * independently fitted offset. Numerical event and mesh counts qualify the
 * selected representation; they do not observe hidden physical topology.
 */
export interface IAutoMovieRecoverySupportFit {
  /** Independently generative coefficients and edit/coverage metadata. */
  recipe: IAutoMovieRecoverySupportLoft;

  /** Analytic, photographic and inconsistent-input evidence remain distinct. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /**
   * Every training source identity; camera charts remain in the observation
   * artifact.
   */
  sources: IAutoMovieRecoveryImageSource[];

  /** Maximum pixel residual of fitted offsets or their implied polygon supports. */
  maximumResidualPx: number;

  /** Selected unpivoted Householder diagonal ratio; not a certified condition. */
  splineRankRatio: number;

  /**
   * Corresponding rows, longitudinal spans and fitted scalar spline
   * coefficients.
   */
  counts: IAutoMovieRecoveryImageFitCounts;

  /** Common measured row-centre interval, in millimetres. */
  observedIntervalMm: [number, number];

  /**
   * Actual selected engine event/interval/mesh counts and numerical boundary
   * defect.
   */
  generation: IAutoMovieRecoverySupportGeneration;
}
