import { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";

/**
 * Aggregate geometry usage and prototype-selection consequence of one structural subject change.
 *
 * @evidence contracts/development/design.md#principled-representation Structural diff counts scene elements and compact slots drawing a changed prototype or part from the revision retaining it, and compares per-slot selected prototype/model identity for a changed common set.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Counts and a bounded set-id summary expose broad consequences without materializing one change object for every compact member.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Usage is derived from compiled model and selection rules rather than multiplying a changed prototype by every set indiscriminately; absent explicit prototype choices remain distinct identities.
 * @evidence contracts/development/common.md#meaningful-documentation Defines affected scene elements, compact slots and bounded set identities, and selection differences including added or removed slots.
 */
export interface IAutoMovieSubjectDiffFanout {
  /**
   * Number of scene elements whose geometry references the changed prototype.
   */
  elements: number;

  /**
   * Number of compact instance slots whose geometry references the prototype.
   */
  instances: number;

  /** Bounded identities of compact sets represented by {@link instances}. */
  instanceSets: IAutoMovieSubjectMemberSummary;

  /** Slots whose selected prototype/model differs between set revisions, including added or removed slots. */
  prototypeChanges: number;
}
