import type { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";

/**
 * Aggregate geometry usage and prototype-selection consequence of one
 * structural subject change.
 */
export interface IAutoMovieSubjectDiffFanout {
  /** Number of scene elements whose geometry references the changed prototype. */
  elements: number;

  /** Number of compact instance slots whose geometry references the prototype. */
  instances: number;

  /** Bounded identities of compact sets represented by {@link instances}. */
  instanceSets: IAutoMovieSubjectMemberSummary;

  /**
   * Slots whose selected prototype/model differs between set revisions,
   * including added or removed slots.
   */
  prototypeChanges: number;
}
