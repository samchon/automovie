/**
 * One source-star accumulation during normal transport: the reference-area weighted sum of transported densities, the star's ancestral unit normal, and whether any incident cell changed.
 *
 * @evidence contracts/common.md#principled-implementation Reference-area weighted transported density accumulates alongside the ancestral unit normal; a changed flag preserves exact ancestral charts when incident cells are unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One per-star accumulator keeps the sum and unchanged reference needed by the transport readout together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The unchanged branch follows exact incident geometry, not a tolerance that would hide a small real deformation.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish weighted density sum, ancestral normal and whether any incident fixed cell moved.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The normal-star density accumulation and unchanged reference specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the normal-star density accumulation and unchanged reference; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The normal-star density accumulation and unchanged reference acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalStar {
  /** Reference-area weighted sum of transported densities. */
  sum: number[];

  /** The star's ancestral unit normal. */
  reference: readonly number[];

  /** Whether any incident fixed cell moved. */
  changed: boolean;
}
