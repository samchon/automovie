/**
 * One edge of a source cell while proving chart coverage: its first recorded direction and how many cells have used the undirected edge.
 *
 * @evidence contracts/common.md#principled-implementation An undirected edge stores its first directed use and occurrence count, so a second cell must cancel that exact direction once.
 * @evidence contracts/common.md#clear-and-simple-design The coverage owner needs only endpoints and count to distinguish boundary edges from paired interior edges.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Edge cancellation records actual cell incidence rather than permitting unmatched edges under a geometric tolerance.
 * @evidence contracts/common.md#meaningful-documentation Comments identify first direction and the admitted one-or-two cell use count.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The coverage edge orientation and occurrence-count records are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the coverage edge orientation and occurrence-count records; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring coverage edge orientation and occurrence-count records acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceEdge {
  /** Sample ID the edge leaves in its first recorded direction. */
  from: number;

  /** Sample ID the edge reaches in its first recorded direction. */
  to: number;

  /** Number of cells that have used the edge, one or two. */
  count: number;
}
