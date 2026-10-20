import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";
import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";

/**
 * Two building bodies whose part-box proxy volume fold emitted an intersection.
 *
 * Exact face contact is not intersection, so construction that merely meets is
 * absent from a sweep. What remains is graded: a quoin toothed one centimetre
 * into its wall and a column standing entirely inside one are both
 * intersections but not the same finding, so the shared volume travels with
 * the pair and the fraction says how much of the smaller body is inside the
 * larger.
 *
 * @evidence contracts/common.md#principled-implementation The sweep sums pairwise AABB intersection-volume products and divides by the smaller body's summed part-box volume, clamping the ratio to one. These static proxies can include empty mesh/member gaps and double-count overlapping parts. Representable finite products/sums are a premise: extreme bounds can overflow volume and produce NaN ratios, and the fold currently filters only volume <= 0 rather than independently rejecting nonfinite metrics.
 * @evidence contracts/common.md#clear-and-simple-design Each body carries its locator and basis side by side, and the two numbers are the only grading the sweep sorts by, so no severity class or threshold is stored on the pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parts of one body that overlap each other are counted for each, and the fraction is clamped to `1` for that reason; the clamp is documented on the member rather than hidden, and no body kind is exempt from the sweep.
 * @evidence contracts/common.md#meaningful-documentation States declaration order, cubic-metre pairwise volume sums, duplicate-part counting, ratio/clamp/zero-denominator rules and the finite-product premises behind positive volume and fraction range.
 */
export interface IAutoMovieBuiltPlacementOverlapPair {
  /**
   * The body that appears first in record order, where elements precede
   * populations.
   */
  left: AutoMovieBuiltPlacementBodyLocator;

  /** The body that appears later in record order. */
  right: AutoMovieBuiltPlacementBodyLocator;

  /** Derivation of the left body's extent. */
  leftBasis: Exclude<AutoMovieBuiltPlacementBasis, "surface-height-rule">;

  /** Derivation of the right body's extent. */
  rightBasis: Exclude<AutoMovieBuiltPlacementBasis, "surface-height-rule">;

  /**
   * Summed part-box pair intersection products in cubic metres, positive under finite usable arithmetic. Overlapping parts are counted per pair; elements use static CPU part boxes and populations/origin fallbacks their one reported box. The current volume <= 0 filter does not reject an overflowed or NaN product.
   */
  volume: number;

  /**
   * Shared proxy volume divided by the smaller summed part-box volume, clamped to one; the zero-denominator branch yields zero. Finite representable positive numerator/denominator normally yield a value in (0, 1], but overflow can yield NaN and underflow can lose a positive ratio. This is proxy grading, not occupied-material intersection fraction.
   */
  fraction: number;
}
