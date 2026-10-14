/**
 * Feature normal binding of one used surface vertex to a source-defined cell.
 * The cell is a local ordinal under the raw parent's normal subdivision, and
 * coordinates [u,v] use that cell's ordered corners, not the parent's chart.
 * Later clipping carries this binding through its frozen chart instead of
 * creating another normal star.
 *
 * @evidence contracts/common.md#principled-implementation A raw parent ordinal, local feature-cell ordinal and ordered two-coordinate chart bind one used vertex's normal transport.
 * @evidence contracts/common.md#clear-and-simple-design The feature-cell binding is distinct from raw parent-only binding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clipping preserves the frozen chart instead of inventing a new normal incidence star.
 * @evidence contracts/common.md#meaningful-documentation Members define parent scope, cell scope and dimensionless coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The feature normal cell binding has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The feature normal cell binding schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The feature normal cell binding declaration allocates no runtime state or handles.
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
