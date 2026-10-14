/**
 * One used vertex's admitted normal binding: its raw source parent and, for a feature binding, the global fixed-cell ordinal and its owned dimensionless [u, v] chart over that cell's ordered corners. A raw binding has neither and reads the canonical source chart.
 *
 * @evidence contracts/common.md#principled-implementation An admitted raw parent optionally carries a fixed-cell ordinal and affine chart; feature cells retain their own corner chart rather than reading the raw parent's.
 * @evidence contracts/common.md#clear-and-simple-design Raw and feature lookup share a compact record whose admitted optional pair is enforced by the normal transport validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Feature correspondence comes from the admitted source tree instead of a fitted normal chosen from a nearby triangle.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish raw parent ordinal, global fixed-cell ordinal, owned dimensionless coordinates and the raw-chart omission state.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The raw or feature normal-cell binding metadata specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the raw or feature normal-cell binding metadata; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The raw or feature normal-cell binding metadata acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalBinding {
  /** Raw parent ordinal in the source triangle tree. */
  parent: number;

  /** Global fixed normal-cell ordinal, for a feature binding. */
  cell?: number;

  /** Dimensionless [u, v] chart over that cell's corners, for a feature binding. */
  coordinates?: [number, number];
}
