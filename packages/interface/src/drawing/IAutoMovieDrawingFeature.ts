import type { AutoMovieDrawingFeatureKind } from "./AutoMovieDrawingFeatureKind";

/**
 * Which geometric feature of the design an annotation or dimension is pinned
 * to.
 *
 * Derivation re-resolves this positional address against current static CPU
 * geometry. It moves the note anchor or recomputes a dimension, but note text
 * is copied as authored. Coordinate sorting can renumber features after
 * rotation or deformation, and equal feature counts do not establish that an
 * index still identifies the originally intended feature.
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
   * Vertices and edges are welded at six decimals and sorted by world grid
   * coordinates; unchanged grid geometry keeps its ordering when parts reorder.
   * Within a shared grid key the last emitted unrounded representative wins, so
   * part order can still change the resolved point. Rotation or deformation can
   * reorder keys. Faces retain part/triangle emission order. Axis indices are
   * 0, 1 and 2 for local X, Y and Z; centroid requires 0.
   */
  index: number;

  /**
   * Feature count the target was authored against, or `null` to skip the check.
   * An `axis` family always counts `3` and a `centroid` family `1`.
   *
   * A changed family count makes the target stale even when its index remains
   * in range. Equal counts skip that refusal and do not prove unchanged
   * topology, coordinates or intended identity; null skips only the count
   * check, not index admission.
   */
  count: number | null;
}
