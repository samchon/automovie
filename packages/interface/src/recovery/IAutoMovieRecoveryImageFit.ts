import type {
  IAutoMovieRecoveryImageDirectionRank,
  IAutoMovieRecoveryImageFitCounts,
  IAutoMovieRecoveryImageLoft,
  IAutoMovieRecoveryImageSource,
} from "..";

/**
 * Evidence emitted with a partial aligned-ellipse result. Fit residuals compare
 * silhouette edges in the supplied charts on the common row domain. The numeric
 * rank diagnostics describe the designs used in that solve.
 */
export interface IAutoMovieRecoveryImageFit {
  /**
   * Aligned-ellipse generation recipe, with fitted coefficients and explicit
   * unseen regions.
   */
  recipe: IAutoMovieRecoveryImageLoft;

  /** Acquisition class carried from the observation and retained with this fit. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /**
   * Fixed capture IDs and recorded hashes in the original observation view
   * order.
   */
  sources: IAutoMovieRecoveryImageSource[];

  /**
   * Largest absolute silhouette edge displacement for the chosen longitudinal
   * profile, in each view's pixels.
   */
  maximumResidualPx: number;

  /**
   * Largest absolute silhouette edge displacement after solving each sampled
   * section independently, in each view's pixels.
   */
  familyResidualPx: number;

  /**
   * Smaller-to-larger singular value ratios for the squared radius and
   * unsquared center designs.
   */
  directionRank: IAutoMovieRecoveryImageDirectionRank;

  /**
   * Smallest-to-largest Householder QR diagonal magnitude of the selected
   * longitudinal spline design.
   */
  splineRankRatio: number;

  /**
   * Common station, longitudinal span, and independent scalar coefficient
   * counts for the chosen fit.
   */
  counts: IAutoMovieRecoveryImageFitCounts;

  /**
   * Lower and upper endpoints of the intersected physical row-centre domains,
   * in millimetres.
   */
  observedIntervalMm: [number, number];

  /**
   * Reported limits of the inferred domain, including common-row interpolation
   * and the dependence on calibration and segmentation.
   */
  diagnostics: string[];
}
