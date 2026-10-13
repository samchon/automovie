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
 * @author Samchon
 */
export interface IAutoMovieMeshSeparationAttachment {
  /** Original resident triangle ordinal carrying the canonical root seat. */
  triangle: number;

  /**
   * Barycentric seat weights in the seat triangle's vertex order; the root
   * must equal the interpolated original seat in the query's representation.
   */
  weights: readonly number[];

  /**
   * Original resident triangle ordinals incident on the seat's active support,
   * nonempty and including `triangle`.
   */
  supports: readonly number[];
}
