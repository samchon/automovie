/** Structured source support and its explicitly identified zero-height columns.
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
