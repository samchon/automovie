/**
 * What a person's source skin at rest measures: a Float32 height range and signed divergence volume. The reader requires two triangle uses per undirected source edge; it does not independently prove outward winding or absence of self-intersection, so a positive anatomical volume needs those source premises.
 *
 * @evidence contracts/common.md#principled-implementation Height extrema and the signed triangle divergence sum use the same Float32 rest samples; two-use edge admission supplies closure incidence without independently certifying outward winding or intersection-free anatomy.
 * @evidence contracts/common.md#clear-and-simple-design A two-field reading separates geometric measurement results from population metadata and inversion controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Measurements describe built rest geometry rather than target values copied from the document's requested channels.
 * @evidence contracts/common.md#meaningful-documentation Properties define highest-minus-lowest height, cubic-metre signed volume and the source orientation/intersection premises needed for anatomical interpretation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The stature and enclosed-volume result scalars are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the stature and enclosed-volume result scalars; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring stature and enclosed-volume result scalars acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonRestReading {
  /** Highest minus lowest Float32 skin height at rest, metres. */
  statureMetres: number;

  /** Signed triangle divergence volume at rest, cubic metres; outward winding and valid embedding belong to source admission. */
  volumeCubicMetres: number;
}
