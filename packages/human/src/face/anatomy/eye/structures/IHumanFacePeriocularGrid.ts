/** Structured source support and its explicitly identified zero-height columns.
 *
 *
 * @evidence contracts/common.md#principled-implementation Grid dimensions accompany explicitly declared physical endpoint columns.
 * @evidence contracts/common.md#clear-and-simple-design The canonical topology owner applies one row-zero quotient shared by shells and mapping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinate coincidence does not choose which columns collapse.
 * @evidence contracts/common.md#meaningful-documentation Fields state source row/column counts and all-rows-same-endpoint meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularGrid is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularGrid declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularGrid acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularGrid {
  /** Number of source sample columns. */
  stride: number;

  /** Number of source sample rows. */
  height: number;

  /** Columns whose every row is the same source endpoint. */
  collapsedColumns: ReadonlySet<number>;
}
