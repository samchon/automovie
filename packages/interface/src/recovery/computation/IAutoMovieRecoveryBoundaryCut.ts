import type { AutoMovieVector3Tuple } from "../../index";

/**
 * One admitted fractional cut on an original chart-boundary edge.
 * fraction is dimensionless in canonical endpoint order, point uses registered millimetres, and aliases retains the original incidence names in a mutable set. Registry admission checks point and fraction consistency.
 *
 * @evidence contracts/development/common.md#meaningful-documentation One admitted fractional cut on an original chart-boundary edge. fraction is dimensionless in canonical endpoint order, point uses registered millimetres, and aliases retains the original incidence names in a mutable set. Registry admission checks point and fraction consistency.
 * @evidence contracts/development/design.md#principled-representation fraction is dimensionless in canonical endpoint order, point uses registered millimetres, and aliases retains the original incidence names in a mutable set. Registry admission checks point and fraction consistency.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Boundary registration, augmentation and master-curve binding share this cut rather than rebuilding its ancestry from coordinates.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The cut records declared ancestry and admitted aliases; it does not infer positional welds or confer independent coefficient authority.
 */
export type IAutoMovieRecoveryBoundaryCut = {
  /** Stable incidence identity used for deterministic registry lookup; matching text does not imply coordinate equality. */
  key: string;

  /** Dimensionless position along the original canonical edge, in increasing endpoint order. */
  fraction: number;

  /** Admitted boundary position in the registered millimetre frame. */
  point: Readonly<AutoMovieVector3Tuple>;

  /** Explicit original-to-canonical incidence aliases; no proximity matching is inferred. */
  aliases: Set<string>;
};
