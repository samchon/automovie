import type { IAutoMovieRecoveryFileReceipt } from "./IAutoMovieRecoveryFileReceipt";

/**
 * Explicit spool identity and finite immutable frontier read budgets.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One independently named record is shared by its producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/development/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 */
export interface IAutoMovieRecoveryMeshFrontierInput {
  /** Exact immutable receipt of the last closed journal. */
  frontier: IAutoMovieRecoveryFileReceipt;

  /** Owning spool directory. */
  directory: string;

  /** Exact source and input binding expected in every journal. */
  expectedBinding: object;

  /** Positive maximum journal population. */
  maxJournals: number;

  /** Positive maximum fragment population. */
  maxFragments: number;

  /** Positive byte limit per journal. */
  maxJournalBytes: number;

  /** Positive byte limit per fragment. */
  maxFragmentBytes: number;
}
