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
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingFeature` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingFeature` for the interior space drawing schedule quantity system contract.
 * @author Samchon
 */
export interface IAutoMovieDrawingFeature {
  /**
   * Building element the feature belongs to.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `element` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `element` for the interior space drawing schedule quantity system contract.
   */
  element: string;

  /**
   * Model part within the element, or `null` for the element's whole geometry.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `part` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `part` for the interior space drawing schedule quantity system contract.
   */
  part: string | null;

  /**
   * Which family of feature is addressed.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `kind` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `kind` for the interior space drawing schedule quantity system contract.
   */
  kind: AutoMovieDrawingFeatureKind;

  /**
   * Index into the addressed family, in the engine's canonical order.
   *
   * Vertices, edges and faces are addressed in a canonical order derived from
   * the geometry itself rather than in the order the model happened to emit
   * them, so reordering a model's parts does not move every note on every
   * sheet. For `axis` this is `0`, `1` or `2` for the element's local X, Y or
   * Z; for `centroid` it is ignored and must be `0`.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `index` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `index` for the interior space drawing schedule quantity system contract.
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
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `count` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `count` for the interior space drawing schedule quantity system contract.
   */
  count: number | null;
}
