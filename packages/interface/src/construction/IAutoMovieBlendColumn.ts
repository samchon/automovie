import type { IAutoMovieBlendCrossJet } from "./IAutoMovieBlendCrossJet";

/**
 * Paired boundary ribbons of one blend column, oriented in increasing cross share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Start is cross share zero and end is one; both derivatives use that dimensionless clock and world millimetres.
 * @evidence contracts/development/design.md#principled-representation Two complete boundary jets define one quintic Hermite column without changing rail phase or physical station units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SplitBand, SolidJoin and BlendChain.strip exchange this pair; join-specific rail and outward direction remain on the join record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pair does not certify positive span, monotonicity or unfolding; the builder owns numerical checks.
 */
export interface IAutoMovieBlendColumn {
  /** Start boundary at cross share zero, with derivatives toward increasing share. */
  start: IAutoMovieBlendCrossJet;

  /** End boundary at cross share one, with the same derivative orientation. */
  end: IAutoMovieBlendCrossJet;
}
