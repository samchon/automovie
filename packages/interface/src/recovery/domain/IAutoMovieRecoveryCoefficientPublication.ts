import type { IAutoMovieRecoveryCoefficientOverride } from "../../index";

/**
 * Provenance of coefficient overrides while retaining the original observation reports.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Producer source revision for this coefficient publication. Confirms that the original reports remain attached rather than being rewritten for the overrides.
 * @evidence contracts/development/design.md#principled-representation Provenance of coefficient overrides while retaining the original observation reports.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryAnalyticDomainsInput share IAutoMovieRecoveryCoefficientPublication's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryCoefficientPublication {
 
 /** Producer source revision for this coefficient publication. */
  sourceCommit: string;

 
 /** Confirms that the original reports remain attached rather than being rewritten for the overrides. */
  originalReportsRetained: true;

 
 /** Per-curve numerical estimates belonging to the override publication. */
  overrides: readonly IAutoMovieRecoveryCoefficientOverride[];
}
