import type { IAutoMovieRecoveryMapObservation } from "../image/IAutoMovieRecoveryMapObservation";

/**
 * Nonconflicting appearance component before geometric point qualification.
 *
 * @evidence contracts/common.md#principled-implementation A component has one feature per participating view and a deterministic minimum-node identity.
 * @evidence contracts/common.md#clear-and-simple-design The named linker output remains separate from a triangulated and qualified map landmark.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A conflict-free component is tentative appearance linkage, not material or geometric truth.
 * @evidence contracts/common.md#meaningful-documentation The id is the minimum global feature-node index; observations retain input view indices and original pixels.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no linking.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the bounded observation array without solver state or external resources.
 */
export interface IAutoMovieRecoveryLinkedTrack {
  /** Deterministic minimum global feature-node index in the linked component. */
  id: number;

  /** Owned original-pixel observations with at most one feature per input view. */
  observations: IAutoMovieRecoveryMapObservation[];
}
