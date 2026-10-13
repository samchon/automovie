import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";
import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";

/**
 * Two bodies of one building whose volumes intersect, and by how much.
 *
 * Exact face contact is not intersection, so construction that merely meets is
 * absent from a sweep. What remains is graded: a quoin toothed one centimetre
 * into its wall and a column standing entirely inside one are both
 * intersections but not the same finding, so the shared volume travels with
 * the pair and the fraction says how much of the smaller body is inside the
 * larger.
 *
 * @evidence contracts/common.md#principled-implementation The shared volume sums the axis-aligned intersection volumes of every part-box pair across the two bodies, and the fraction divides it by the smaller body's summed part volume; the premise is that part boxes stand in for the drawn solids, so a diagonal part over-reports by its box's empty corners.
 * @evidence contracts/common.md#clear-and-simple-design Each body carries its locator and basis side by side, and the two numbers are the only grading the sweep sorts by, so no severity class or threshold is stored on the pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parts of one body that overlap each other are counted for each, and the fraction is clamped to `1` for that reason; the clamp is documented on the member rather than hidden, and no body kind is exempt from the sweep.
 * @evidence contracts/common.md#meaningful-documentation States the record-order meaning of left and right, the cubic-metre unit and positive floor of `volume`, how both volumes are summed from part boxes, and the open-closed range of `fraction` with its clamp.
 * @author Samchon
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
   * Shared volume in cubic metres, always greater than zero: the sum of the
   * intersection volumes of every pair of part boxes, one from each body, so
   * parts of one body that overlap each other are counted for each. An element
   * contributes its drawn part boxes; a population or an element drawing no
   * part contributes its one reported box.
   */
  volume: number;

  /**
   * Shared volume over the smaller body's own volume, greater than `0` and at
   * most `1`. A body's own volume is the sum of its part box volumes, and the
   * ratio is clamped to `1` because self-overlapping parts can push it higher.
   */
  fraction: number;
}
