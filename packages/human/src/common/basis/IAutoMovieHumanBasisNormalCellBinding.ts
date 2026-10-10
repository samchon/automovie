/**
 * Feature normal binding of one used surface vertex to a source-defined cell.
 * The cell is a local ordinal under the raw parent's normal subdivision, and
 * coordinates [u,v] use that cell's ordered corners, not the parent's chart.
 * Later clipping carries this binding through its frozen chart instead of
 * creating another normal star.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBasisNormalCellBinding {
  /** Raw parent ordinal in the enclosing partition's original triangle tree. */
  readonly parent: number;

  /** Local normal-cell ordinal under that parent's subdivision. */
  readonly cell: number;

  /** Dimensionless [u,v] chart coordinates over the cell's ordered corners. */
  readonly coordinates: readonly [number, number];
}
