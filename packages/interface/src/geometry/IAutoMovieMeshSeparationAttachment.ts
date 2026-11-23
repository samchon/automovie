/**
 * Canonical barycentric root registration of an anchored separation feature.
 *
 * The queried feature's first vertex is the root, seated on the original
 * resident triangle `triangle` by `weights` in that triangle's vertex order.
 * `supports` lists the original resident triangles incident on the seat's
 * active support, the corners with positive weight, including `triangle`
 * itself. The separation query admits this metadata only at zero clearance and
 * only for a three-vertex fan, and throws when the root differs from the seat
 * recomputed in the query's representation or when a listed support does not
 * contain every active corner. Each admitted support then needs a bounded
 * contact cap instead of strict separation. An incident triangle missing from
 * `supports` is held to strict separation, which the touching root fails, so an
 * incomplete list makes the feature uncertified rather than accepted.
 */
export interface IAutoMovieMeshSeparationAttachment {
  /** Original resident triangle ordinal carrying the canonical root seat. */
  triangle: number;

  /**
   * Three nonnegative barycentric seat weights in the seat triangle's vertex
   * order whose sum encloses one; the root must equal the seat they
   * interpolate, rounded to Float32 for a Float32 query.
   */
  weights: readonly number[];

  /**
   * Original resident triangle ordinals incident on every positive-weight
   * corner of the seat, nonempty and including `triangle`.
   */
  supports: readonly number[];
}
