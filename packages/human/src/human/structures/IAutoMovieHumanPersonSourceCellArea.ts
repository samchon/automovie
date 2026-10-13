/**
 * One performed cell's area vector (square metres, Y up, +Z forward) and the flat offset of its parent triangle's slot in the parent area array.
 *
 * @evidence contracts/common.md#principled-implementation Each performed child area vector addresses its parent's flat area-vector slot, allowing child direction checks against the complete parent sum.
 * @evidence contracts/common.md#clear-and-simple-design The flat parent offset is retained with the vector so the second admission pass need not reconstruct triangle ancestry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The vector comes from actual performed cells rather than neutral area used to hide a fold.
 * @evidence contracts/common.md#meaningful-documentation Comments state square-metre vectors and clarify that parent is a flat offset rather than a triangle ordinal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The performed child area vector with parent flat offset are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the performed child area vector with parent flat offset; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring performed child area vector with parent flat offset acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCellArea {
  /** Flat offset of the parent triangle's area-vector slot. */
  parent: number;

  /** The cell's area vector, square metres. */
  vector: number[];
}
