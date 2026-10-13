import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";
import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";

/**
 * Two bodies of one building whose volumes intersect, and by how much.
 *
 * Exact face contact is not intersection, so joined construction that merely
 * meets is absent from a sweep rather than filling it. What remains is graded:
 * a quoin toothed one centimetre into its wall and a column standing entirely
 * inside one are both intersections and are not the same finding, so the shared
 * volume travels with the pair and the fraction says how much of the smaller
 * body is inside the larger.
 *
 * @author Samchon
 */
export interface IAutoMovieBuiltPlacementOverlapPair {
  /** The body that appears first in record order. */
  left: AutoMovieBuiltPlacementBodyLocator;

  /** The body that appears later in record order. */
  right: AutoMovieBuiltPlacementBodyLocator;

  /** Derivation of the left body's extent. */
  leftBasis: Exclude<AutoMovieBuiltPlacementBasis, "surface-height-rule">;

  /** Derivation of the right body's extent. */
  rightBasis: Exclude<AutoMovieBuiltPlacementBasis, "surface-height-rule">;

  /** Shared volume in cubic metres, always greater than zero. */
  volume: number;

  /**
   * Shared volume over the smaller body's own volume, within `[0, 1]`. It is
   * `0` when that body measures no volume, which an `element-origin-point`
   * basis explains and which cannot intersect anything in the first place.
   */
  fraction: number;
}
