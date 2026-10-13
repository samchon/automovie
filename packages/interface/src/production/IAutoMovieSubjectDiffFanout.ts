import { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";

/** Aggregate consequence of one structural subject change. */
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

  /** Number of slots whose selected prototype differs between set revisions. */
  prototypeChanges: number;
}
