/**
 * One finite source interval bounded by two explicitly requested section planes.
 *
 * @evidence contracts/common.md#principled-implementation Increasing signed physical coordinates select an existing observation interval without inventing a surface or changing its cut planes.
 * @evidence contracts/common.md#clear-and-simple-design Two scalars identify the source slab consumed by the fixed-section observation owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This record selects no source component, anatomical label or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, order and the requirement that both planes occur in coordinatesMm.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns two finite scalar fields.
 */
export interface IAutoMovieRecoverySlabPair {
  /** Lower physical coordinate, millimetres along the normalized section axis. */
  beforeMm: number;

  /** Upper physical coordinate, strictly greater than beforeMm, also explicitly requested. */
  afterMm: number;
}
