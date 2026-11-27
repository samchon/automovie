import type {
  IAutoMovieRecoveryAnalyticDomain,
  IAutoMovieRecoveryCoefficientPublication,
  IAutoMovieRecoveryMeshSections,
} from "..";

/**
 * Bernstein section coefficients extended by optional source-free analytic
 * recipes. Original saved curve phases and observation reports retain their
 * independent meaning.
 */

export interface IAutoMovieRecoveryAnalyticDomainsInput extends IAutoMovieRecoveryMeshSections {
  /**
   * Optional coefficient-override provenance; original observation reports are
   * retained.
   */
  coefficientPublication?: IAutoMovieRecoveryCoefficientPublication;

  /**
   * Optional analytic owners; absence leaves the ordinary saved contour and
   * open operators responsible.
   */
  analyticDomains?: readonly IAutoMovieRecoveryAnalyticDomain[];
}
