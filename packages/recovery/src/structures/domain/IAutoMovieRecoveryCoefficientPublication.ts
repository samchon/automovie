import type { IAutoMovieRecoveryCoefficientOverride } from "./IAutoMovieRecoveryCoefficientOverride";

/**
 * Provenance of coefficient overrides while retaining the original observation reports.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing saved coefficient, ownership and observation contract without transformation.
 * @evidence contracts/common.md#clear-and-simple-design This independent record exposes the actual reconstruction input shared by its producer and consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration admits no source mesh, inferred observations or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Members state identity, physical units, optional presence and qualification boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runtime admission and realization own computational reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the records and immutable recipe arrays.
 */
export interface IAutoMovieRecoveryCoefficientPublication {
  /** Producer source revision for this coefficient publication. */
  sourceCommit: string;

  /** Confirms that the original reports remain attached rather than being rewritten for the overrides. */
  originalReportsRetained: true;

  /** Per-curve numerical estimates belonging to the override publication. */
  overrides: readonly IAutoMovieRecoveryCoefficientOverride[];
}
