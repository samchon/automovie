/**
 * One cell of a source triangle tree: its parent-triangle ordinal and its oriented canonical sample IDs, read against the parent's ordered corners.
 *
 * @evidence contracts/common.md#principled-implementation One parent triangle and three oriented canonical samples express a child cell in its parent's ordered affine chart.
 * @evidence contracts/common.md#clear-and-simple-design The small cell record serves both geometric and normal-subdivision coverage without embedding evaluated positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Canonical sample IDs preserve source lineage rather than coordinates rounded to a matching fixture.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish parent-triangle ordinal from oriented canonical corner identities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The oriented source-cell parent and corner identities are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the oriented source-cell parent and corner identities; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring oriented source-cell parent and corner identities acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCell {
  /** Ordinal of the parent triangle in the source tree. */
  parent: number;

  /** Oriented canonical sample IDs of the cell's corners. */
  samples: readonly number[];
}
