import type { IAutoMovieRecoveryFileReceipt } from "./IAutoMovieRecoveryFileReceipt";

/**
 * Explicit spool identity and finite immutable frontier read budgets.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/common.md#clear-and-simple-design One independently named record is shared by its producer and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its runtime owner controls publication and computational reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records remain caller-owned and the type acquires no resource handle.
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
