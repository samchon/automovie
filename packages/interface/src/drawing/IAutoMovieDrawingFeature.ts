import { AutoMovieDrawingFeatureKind } from "./AutoMovieDrawingFeatureKind";

/**
 * Which geometric feature of the design an annotation or dimension is pinned
 * to.
 *
 * A note that says "2.4 m" beside a wall is wrong the moment the wall moves. A
 * note pinned to a feature is re-derived from the design every time the
 * drawing is taken, so it either moves with the wall or reports that it could
 * not find it; a stale number that still looks right is the only wrong
 * outcome.
 *
 * @evidence contracts/common.md#principled-implementation `resolveAutoMovieDrawingFeature` places the element by its world matrix, filters the model's parts when `part` is set, builds the addressed family in a canonical order, and refuses a non-integer or out-of-range index or a count that differs from the current family size.
 * @evidence contracts/common.md#clear-and-simple-design Element, part, family, index and an optional count are the minimal address that survives reordering where the family is sorted and detects replacement where it is not, without storing any coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A changed feature count makes the target stale instead of relocating it onto whichever feature inherited the index, and an unresolvable target never snaps to the nearest surviving feature.
 * @evidence contracts/common.md#meaningful-documentation States what places the feature, when `part` is ignored, which families renumber under reordering and which do not, the legal index for `axis` and `centroid`, and what the authored count protects against.
 * @author Samchon
 */
export interface IAutoMovieDrawingFeature {
  /** Building element the feature belongs to; its world matrix places it. */
  element: string;

  /**
   * Model part within the element, or `null` for the element's whole geometry.
   * Ignored for `axis`.
   */
  part: string | null;

  /** Which family of feature is addressed. */
  kind: AutoMovieDrawingFeatureKind;

  /**
   * Integer index into the addressed family.
   *
   * Vertices and edges are welded at six decimals and sorted by coordinate, so
   * reordering a model's parts does not renumber them. Faces are triangles in
   * the order the model's parts emit them, so reordering parts or changing the
   * triangulation does renumber face targets. For `axis` this is `0`, `1` or
   * `2` for the element's local X, Y or Z; for `centroid` it must be `0`.
   */
  index: number;

  /**
   * Feature count the target was authored against, or `null` to skip the check.
   * An `axis` family always counts `3` and a `centroid` family `1`.
   *
   * This separates "the wall moved" from "the wall is a different wall". A
   * positional index re-resolves against changed geometry, which is the point,
   * but if the count changed the index now addresses a different feature, and
   * the target is reported stale rather than silently relocated.
   */
  count: number | null;
}
