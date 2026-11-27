import type { IAutoMovieFileReceipt } from "..";

/** Explicit spool identity and finite immutable frontier read budgets. */

export interface IAutoMovieRecoveryMeshFrontierInput {
  /** Exact immutable receipt of the last closed journal. */
  frontier: IAutoMovieFileReceipt;

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
