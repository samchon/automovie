import type { IAutoMovieRecoveryAnalyticDomain, IAutoMovieRecoveryCoefficientPublication, IAutoMovieRecoveryMeshSections } from "../../index";

/**
 * Bernstein section coefficients extended by optional source-free analytic recipes. Original saved curve phases and observation reports retain their independent meaning.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Optional coefficient-override provenance; original observation reports are retained. Optional analytic owners; absence leaves the ordinary saved contour and open operators responsible.
 * @evidence contracts/development/design.md#principled-representation Optional coefficient-override provenance; original observation reports are retained.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryAnalyticRealizationInput, IAutoMovieRecoveryTensorFamiliesInput share IAutoMovieRecoveryAnalyticDomainsInput's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional analytic owners; absence leaves the ordinary saved contour and open operators responsible.
 */

export interface IAutoMovieRecoveryAnalyticDomainsInput extends IAutoMovieRecoveryMeshSections {
 
 /** Optional coefficient-override provenance; original observation reports are retained. */
  coefficientPublication?: IAutoMovieRecoveryCoefficientPublication;

 
 /** Optional analytic owners; absence leaves the ordinary saved contour and open operators responsible. */
  analyticDomains?: readonly IAutoMovieRecoveryAnalyticDomain[];
}
