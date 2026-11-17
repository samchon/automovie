import type { IAutoMovieRecoveryOpenArcAddress } from "../../index";

/**
 * Admitted directed continuation between open arcs of adjacent saved sections.
 * before/after retain saved arc addresses, reverse is the explicit endpoint orientation witness, and pairOrdinal addresses the original interval pair list even when analytic ownership excludes other pairs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Admitted directed continuation between open arcs of adjacent saved sections. before/after retain saved arc addresses, reverse is the explicit endpoint orientation witness, and pairOrdinal addresses the original interval pair list even when analytic ownership excludes other pairs.
 * @evidence contracts/development/design.md#principled-representation before/after retain saved arc addresses, reverse is the explicit endpoint orientation witness, and pairOrdinal addresses the original interval pair list even when analytic ownership excludes other pairs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Local continuation and open-run preparation share this record while keeping their different exclusion/admission policies in their operations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The edge contains no guessed correspondence; both producers reject overlapping arc claims and nonboolean reversal witnesses.
 */
export type IAutoMovieRecoveryOpenContinuationEdge = {
  /** Saved arc address in the earlier of the two adjacent sections. */
  before: IAutoMovieRecoveryOpenArcAddress;

  /** Saved arc address in the later adjacent section. */
  after: IAutoMovieRecoveryOpenArcAddress;

  /** Whether the matched continuation reverses the after-curve's saved order. */
  reverse: boolean;

  /** Original pair ordinal within the earlier section's continuation interval. */
  pairOrdinal: number;
};
