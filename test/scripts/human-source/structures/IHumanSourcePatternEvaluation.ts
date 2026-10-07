/**
 * One completed uncached source evaluation, including an actual refusal.
 * Elapsed time belongs to progress evidence and never to source identity.
 *
 * @author Samchon
 */
export interface IHumanSourcePatternEvaluation<T extends object> {
  /** Count of genuine evaluator calls completed in this search. */
  evaluations: number;

  /** Immutable normalized coordinates sent to that call. */
  parameters: readonly number[];

  /** Numerical mechanism that requested this candidate. */
  stage: "initial" | "explore" | "pattern";

  /** Monotonic elapsed time of this call, milliseconds. */
  elapsedMilliseconds: number;

  /** Actual owner result, or null when the evaluator refused. */
  evaluation: T | null;

  /** Original refusal text; null for an actual result. */
  refusal: string | null;
}
