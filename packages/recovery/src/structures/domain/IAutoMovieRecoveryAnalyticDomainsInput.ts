import type { IAutoMovieRecoveryMeshSections } from "../mesh/IAutoMovieRecoveryMeshSections";
import type { IAutoMovieRecoveryAnalyticDomain } from "./IAutoMovieRecoveryAnalyticDomain";
import type { IAutoMovieRecoveryCoefficientPublication } from "./IAutoMovieRecoveryCoefficientPublication";

/**
 * Bernstein section coefficients extended by optional source-free analytic recipes. Original saved curve phases and observation reports retain their independent meaning.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing saved coefficient, ownership and observation contract without transformation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This independent record exposes the actual reconstruction input shared by its producer and consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration admits no source mesh, inferred observations or replacement geometry.
 * @evidence contracts/development/common.md#meaningful-documentation Members state identity, physical units, optional presence and qualification boundaries.
 */
export interface IAutoMovieRecoveryAnalyticDomainsInput extends IAutoMovieRecoveryMeshSections {
  /** Optional coefficient-override provenance; original observation reports are retained. */
  coefficientPublication?: IAutoMovieRecoveryCoefficientPublication;

  /** Optional analytic owners; absence leaves the ordinary saved contour and open operators responsible. */
  analyticDomains?: readonly IAutoMovieRecoveryAnalyticDomain[];
}
