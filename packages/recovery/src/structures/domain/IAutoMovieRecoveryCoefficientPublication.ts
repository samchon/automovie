import type { IAutoMovieRecoveryCoefficientOverride } from "./IAutoMovieRecoveryCoefficientOverride";

/**
 * Provenance of coefficient overrides while retaining the original observation reports.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing saved coefficient, ownership and observation contract without transformation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This independent record exposes the actual reconstruction input shared by its producer and consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration admits no source mesh, inferred observations or replacement geometry.
 * @evidence contracts/development/common.md#meaningful-documentation Members state identity, physical units, optional presence and qualification boundaries.
 */
export interface IAutoMovieRecoveryCoefficientPublication {
  /** Producer source revision for this coefficient publication. */
  sourceCommit: string;

  /** Confirms that the original reports remain attached rather than being rewritten for the overrides. */
  originalReportsRetained: true;

  /** Per-curve numerical estimates belonging to the override publication. */
  overrides: readonly IAutoMovieRecoveryCoefficientOverride[];
}
