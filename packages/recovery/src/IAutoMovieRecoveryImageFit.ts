import type { IAutoMovieRecoveryImageLoft } from "@automovie/interface/recovery";

/**
 * Qualified fit and acquisition evidence kept outside source-free coefficients.
 * Pixel residuals compare silhouette limits in supplied charts, not material
 * correspondence, surface distance or a rigidity proof. The QR diagonal ratio
 * is an operational rank diagnostic, not a covariance or certified condition.
 *
 * @evidence contracts/common.md#principled-implementation Separate source-free coefficients, actual compared support populations and directional/fitting rank diagnostics expose what the inverse problem identified conditionally on its family and cameras.
 * @evidence contracts/common.md#clear-and-simple-design This report joins one recipe to its numerical and provenance receipt without making dense measurements generation dependencies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No residual, coefficient count or supplied-camera success is promoted to an observed hidden surface or estimated camera result.
 * @evidence contracts/common.md#meaningful-documentation States pixel residual meaning, conditional rank, free-scalar count and separate analytic-versus-photograph cohorts.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result contract performs no fitting or traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record owns no factorization or cross-request cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned recipe and report arrays belong to the caller and acquire no resource handle.
 */
export interface IAutoMovieRecoveryImageFit {
  /** Source-independent recipe with unresolved regions preserved. */
  recipe: IAutoMovieRecoveryImageLoft;

  /** Acquisition cohort, retained outside the recipe. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /** Every fixed training image used, with supplied charts retained in the observation artifact. */
  sources: { id: string; sha256: string }[];

  /** Maximum absolute left/right support residual in each original view's pixels. */
  maximumResidualPx: number;

  /** Maximum conditional section-family residual before longitudinal fitting. */
  familyResidualPx: number;

  /** Direction-design singular-value ratios for squared radius support and centre projection. */
  directionRank: { radii: number; centres: number };

  /** Smallest-to-largest Householder diagonal magnitude for the chosen spline design. */
  splineRankRatio: number;

  /** Number of corresponding physical Y rows and scalar spline coefficients fitted to them. */
  counts: { rows: number; spans: number; freeScalars: number };

  /** Physical row-centre interval covered by every view, in millimetres. */
  observedIntervalMm: [number, number];

  /** Explicit common-domain and unobserved-region limitations. */
  diagnostics: string[];
}
