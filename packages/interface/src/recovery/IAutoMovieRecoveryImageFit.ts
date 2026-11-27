import type {
  IAutoMovieRecoveryImageDirectionRank,
  IAutoMovieRecoveryImageFitCounts,
  IAutoMovieRecoveryImageLoft,
  IAutoMovieRecoveryImageSource,
} from "..";

/**
 * Qualified fit and acquisition evidence kept outside source-free coefficients.
 * Pixel residuals compare silhouette limits in supplied charts, not material
 * correspondence, surface distance or a rigidity proof. The QR diagonal ratio
 * is an operational rank diagnostic, not a covariance or certified condition.
 */
export interface IAutoMovieRecoveryImageFit {
  /** Source-independent recipe with unresolved regions preserved. */
  recipe: IAutoMovieRecoveryImageLoft;

  /** Acquisition cohort, retained outside the recipe. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /**
   * Every fixed training image used, with supplied charts retained in the
   * observation artifact.
   */
  sources: IAutoMovieRecoveryImageSource[];

  /**
   * Maximum absolute left/right support residual in each original view's
   * pixels.
   */
  maximumResidualPx: number;

  /** Maximum conditional section-family residual before longitudinal fitting. */
  familyResidualPx: number;

  /**
   * Direction-design singular-value ratios for squared radius support and
   * centre projection.
   */
  directionRank: IAutoMovieRecoveryImageDirectionRank;

  /**
   * Smallest-to-largest Householder diagonal magnitude for the chosen spline
   * design.
   */
  splineRankRatio: number;

  /**
   * Number of corresponding physical Y rows and scalar spline coefficients
   * fitted to them.
   */
  counts: IAutoMovieRecoveryImageFitCounts;

  /** Physical row-centre interval covered by every view, in millimetres. */
  observedIntervalMm: [number, number];

  /** Explicit common-domain and unobserved-region limitations. */
  diagnostics: string[];
}
