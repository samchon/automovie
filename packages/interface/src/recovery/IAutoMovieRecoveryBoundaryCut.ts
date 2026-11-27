import type { AutoMovieVector3Tuple } from "..";

/**
 * One admitted fractional cut on an original chart-boundary edge. fraction is
 * dimensionless in canonical endpoint order, point uses registered millimetres,
 * and aliases retains the original incidence names in a mutable set. Registry
 * admission checks point and fraction consistency.
 */
export type IAutoMovieRecoveryBoundaryCut = {
  /**
   * Stable incidence identity used for deterministic registry lookup; matching
   * text does not imply coordinate equality.
   */
  key: string;

  /**
   * Dimensionless position along the original canonical edge, in increasing
   * endpoint order.
   */
  fraction: number;

  /** Admitted boundary position in the registered millimetre frame. */
  point: Readonly<AutoMovieVector3Tuple>;

  /**
   * Explicit original-to-canonical incidence aliases; no proximity matching is
   * inferred.
   */
  aliases: Set<string>;
};
