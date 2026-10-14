import type { IAutoMovieHumanPersonSourceCell } from "./IAutoMovieHumanPersonSourceCell";

/**
 * One fixed source normal cell: a source cell with exactly three oriented canonical samples and one deformation-side domain per corner.
 *
 * @evidence contracts/common.md#principled-implementation The normal cell narrows oriented samples to exactly three and pairs each corner with a nonnegative deformation-side domain.
 * @evidence contracts/common.md#clear-and-simple-design Extending the existing source cell reuses its parent identity while fixed-size tuples enforce normal-cell corner arity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Deformation domains remain distinct from ancestral normal domains instead of merging coincident source samples to simplify transport.
 * @evidence contracts/common.md#meaningful-documentation Members define canonical corner order and one deformation-side domain per corner.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The fixed normal-cell corner and domain tuples specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the fixed normal-cell corner and domain tuples; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The fixed normal-cell corner and domain tuples acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalCell extends IAutoMovieHumanPersonSourceCell {
  /** Oriented canonical sample IDs of the three corners. */
  samples: [number, number, number];

  /** Nonnegative deformation-side domain of each corner. */
  domains: [number, number, number];
}
