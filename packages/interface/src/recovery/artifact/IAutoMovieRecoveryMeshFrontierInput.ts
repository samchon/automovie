import type { IAutoMovieFileReceipt } from "../../index";

/**
 * Explicit spool identity and finite immutable frontier read budgets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Exact immutable receipt of the last closed journal. Owning spool directory.
 * @evidence contracts/development/design.md#principled-representation Positive maximum journal population.
 * @evidence contracts/development/design.md#minimal-and-owned-surface readAutoMovieRecoveryMeshFrontier share IAutoMovieRecoveryMeshFrontierInput's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

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
