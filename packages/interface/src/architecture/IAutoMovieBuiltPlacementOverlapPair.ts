import type { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";
import type { IAutoMovieBuiltPlacementBodyLocator } from "./IAutoMovieBuiltPlacementBodyLocator";

/**
 * Two building bodies whose part-box proxy volume fold emitted an intersection.
 *
 * Exact face contact is not intersection, so construction that merely meets is
 * absent from a sweep. What remains is graded: a quoin toothed one centimetre
 * into its wall and a column standing entirely inside one are both
 * intersections but not the same finding, so the shared volume travels with the
 * pair and the fraction says how much of the smaller body is inside the
 * larger.
 */
export interface IAutoMovieBuiltPlacementOverlapPair {
  /**
   * The body that appears first in record order, where elements precede
   * populations.
   */
  left: IAutoMovieBuiltPlacementBodyLocator;

  /** The body that appears later in record order. */
  right: IAutoMovieBuiltPlacementBodyLocator;

  /** Derivation of the left body's extent. */
  leftBasis: Exclude<AutoMovieBuiltPlacementBasis, "surface-height-rule">;

  /** Derivation of the right body's extent. */
  rightBasis: Exclude<AutoMovieBuiltPlacementBasis, "surface-height-rule">;

  /**
   * Summed part-box pair intersection products in cubic metres, positive under
   * finite usable arithmetic. Overlapping parts are counted per pair; elements
   * use static CPU part boxes and populations/origin fallbacks their one
   * reported box. The current volume <= 0 filter does not reject an overflowed
   * or NaN product.
   */
  volume: number;

  /**
   * Shared proxy volume divided by the smaller summed part-box volume, clamped
   * to one; the zero-denominator branch yields zero. Finite representable
   * positive numerator/denominator normally yield a value in (0, 1], but
   * overflow can yield NaN and underflow can lose a positive ratio. This is
   * proxy grading, not occupied-material intersection fraction.
   */
  fraction: number;
}
