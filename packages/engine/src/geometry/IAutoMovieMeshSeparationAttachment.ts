/**
 * Canonical barycentric root registration of an anchored separation feature.
 *
 * The queried feature's first vertex is the root, seated on the original
 * resident triangle `triangle` by `weights` in that triangle's vertex order.
 * `supports` lists every original resident triangle incident on the seat's
 * active support, including `triangle` itself. The separation query admits
 * this metadata only at zero clearance and only for a three-vertex fan; each
 * support then pays a bounded contact cap instead of strict separation.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Names the root registration that lets a composable separation query bound an attached fan's contact instead of exempting it as one zero-distance witness.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Addresses the root seat and its incident supports by original triangle ordinal, surviving the query's owned BVH sort.
 * @author Samchon
 */
export interface IAutoMovieMeshSeparationAttachment {
  /**
   * Original resident triangle ordinal carrying the canonical root seat.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Identifies the seat triangle a composable attachment is registered on.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Uses the original source triangle ordinal rather than a hierarchy position.
   */
  triangle: number;

  /**
   * Barycentric seat weights in the seat triangle's vertex order; the root
   * must equal the interpolated original seat in the query's representation.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Locates the attachment root on its seat triangle without a sampled-corner substitute.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Interpolates the seat from the retained binary64 reference vertices of the original triangle.
   */
  weights: readonly number[];

  /**
   * Original resident triangle ordinals incident on the seat's active support,
   * nonempty and including `triangle`.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Lists every support face that must pay a bounded contact cap for the attached fan.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Requires each support to share the seat's active original vertices by exact reference coordinates.
   */
  supports: readonly number[];
}
