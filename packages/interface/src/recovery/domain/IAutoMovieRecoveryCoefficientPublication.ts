import type { IAutoMovieRecoveryCoefficientOverride } from "../../index";

/**
 * Provenance of coefficient overrides while retaining the original observation
 * reports.
 */

export interface IAutoMovieRecoveryCoefficientPublication {
  /** Producer source revision for this coefficient publication. */
  sourceCommit: string;

  /**
   * Confirms that the original reports remain attached rather than being
   * rewritten for the overrides.
   */
  originalReportsRetained: true;

  /** Per-curve numerical estimates belonging to the override publication. */
  overrides: readonly IAutoMovieRecoveryCoefficientOverride[];
}
