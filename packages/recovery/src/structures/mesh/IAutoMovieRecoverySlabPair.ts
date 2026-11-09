/**
 * One finite source interval bounded by two explicitly requested section planes.
 *
 * @evidence contracts/development/design.md#principled-representation Increasing signed physical coordinates select an existing observation interval without inventing a surface or changing its cut planes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two scalars identify the source slab consumed by the fixed-section observation owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This record selects no source component, anatomical label or replacement geometry.
 * @evidence contracts/development/common.md#meaningful-documentation States millimetres, order and the requirement that both planes occur in coordinatesMm.
 */
export interface IAutoMovieRecoverySlabPair {
  /** Lower physical coordinate, millimetres along the normalized section axis. */
  beforeMm: number;

  /** Upper physical coordinate, strictly greater than beforeMm, also explicitly requested. */
  afterMm: number;
}
