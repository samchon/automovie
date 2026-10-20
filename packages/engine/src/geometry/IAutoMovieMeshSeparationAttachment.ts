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
 * `supports` is held to strict separation, which the touching root fails, so
 * an incomplete list makes the feature uncertified rather than accepted.
 *
 * @evidence contracts/common.md#principled-implementation The query recomputes the seat from the original binary64 corners with `interpolateAutoMovieTrianglePoint`, rounds it to Float32 for that representation, and requires the root to equal it exactly, so a registration cannot claim a seat its root does not occupy.
 * @evidence contracts/common.md#clear-and-simple-design Three fields, the seat triangle, its weights and the incident supports, are what a hair curve already knows from sampling its root, so the query needs no adjacency of its own to decide which faces may touch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supports are verified by exact corner incidence rather than trusted, and the root is compared without tolerance, so no face is exempted by proximity or by a caller's say-so alone.
 * @evidence contracts/common.md#meaningful-documentation States the root convention, the weight order, what the active support is, the admission conditions and refusals, and why an incomplete support list fails safe.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A registration record; admission and contact-cap costs are answered on the separation query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per hair curve and passed to every rooted query of that curve; the record itself computes and caches nothing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds the caller's weight and support arrays by reference for the duration of each query; the query keeps neither after it returns.
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
