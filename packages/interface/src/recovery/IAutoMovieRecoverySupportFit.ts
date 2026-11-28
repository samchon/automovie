import type {
  IAutoMovieRecoveryImageFitCounts,
  IAutoMovieRecoveryImageSource,
  IAutoMovieRecoverySupportGeneration,
  IAutoMovieRecoverySupportLoft,
} from "..";

/**
 * Evidence emitted with a partial convex-support recipe. The fit reports
 * common-row pixel discrepancies and the counts and numerical boundary defect
 * measured by Engine during candidate generation.
 */
export interface IAutoMovieRecoverySupportFit {
  /**
   * Finite-view convex-support generation recipe with dimension factors
   * initially set to one.
   */
  recipe: IAutoMovieRecoverySupportLoft;

  /** Acquisition class carried from the observation. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /**
   * Fixed capture IDs and recorded hashes in the original observation view
   * order.
   */
  sources: IAutoMovieRecoveryImageSource[];

  /**
   * Largest pixel difference across fitted offsets and implied polygon supports
   * against the common-domain silhouette edges.
   */
  maximumResidualPx: number;

  /**
   * Smallest-to-largest unpivoted Householder QR diagonal magnitude for the
   * selected longitudinal spline.
   */
  splineRankRatio: number;

  /**
   * Common stations, spans, and independent spline coefficients across both
   * oriented fields for each view.
   */
  counts: IAutoMovieRecoveryImageFitCounts;

  /**
   * Lower and upper endpoints of the intersected physical row-centre domains,
   * in millimetres.
   */
  observedIntervalMm: [number, number];

  /**
   * Retained events, generated intervals and vertices, and the maximum
   * numerical boundary defect in metres for the fitted candidate.
   */
  generation: IAutoMovieRecoverySupportGeneration;
}
