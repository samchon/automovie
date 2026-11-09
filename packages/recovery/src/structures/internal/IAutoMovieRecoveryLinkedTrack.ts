import type { IAutoMovieRecoveryMapObservation } from "../image/IAutoMovieRecoveryMapObservation";

/**
 * Nonconflicting appearance component before geometric point qualification.
 *
 * @evidence contracts/development/design.md#principled-representation A component has one feature per participating view and a deterministic minimum-node identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named linker output remains separate from a triangulated and qualified map landmark.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A conflict-free component is tentative appearance linkage, not material or geometric truth.
 * @evidence contracts/development/common.md#meaningful-documentation The id is the minimum global feature-node index; observations retain input view indices and original pixels.
 */
export interface IAutoMovieRecoveryLinkedTrack {
  /** Deterministic minimum global feature-node index in the linked component. */
  id: number;

  /** Owned original-pixel observations with at most one feature per input view. */
  observations: IAutoMovieRecoveryMapObservation[];
}
