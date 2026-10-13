import { AutoMovieDrawingFeatureKind } from "./AutoMovieDrawingFeatureKind";

/**
 * Which geometric feature of the design an annotation or dimension is pinned
 * to.
 *
 * A note that says "2.4 m" beside a wall is a lie the moment the wall moves. A
 * note pinned to a feature is re-derived from the design every time the drawing
 * is taken, so it either moves with the wall or says out loud that it could not
 * find it. Both outcomes are correct; a stale number that still looks right is
 * the only wrong one.
 *
 * @evidence contracts/common.md#principled-implementation Positional addressing over computed families: `resolveAutoMovieDrawingFeature` welds vertices and undirected edges at six decimals and sorts them numerically, takes faces in emission order, and treats a changed `count` as a different feature rather than relocating the target.
 * @evidence contracts/common.md#clear-and-simple-design Element, optional part, kind, index and optional count address any computed feature without storing coordinates that would go stale.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Faces are not canonicalized as vertices and edges are, so reordering parts renumbers face targets and `count` cannot notice when the triangle total is unchanged; stated in the prose and reported as a finding.
 * @evidence contracts/common.md#meaningful-documentation States how each family is ordered, the axis and centroid index rules, what a `null` part means, and what `count` protects against.
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
   * Index into the addressed family.
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
   *
   * This is what separates "the wall moved" from "the wall is a different
   * wall". A positional index re-resolves happily against changed geometry,
   * which is the point; but if the count changed, the index now addresses a
   * different feature, and the target is reported stale rather than silently
   * relocated onto whichever feature inherited the number.
   */
  count: number | null;
}
