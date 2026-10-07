import type { IHumanSourcePatternEvaluation } from "./IHumanSourcePatternEvaluation.ts";

/**
 * Immutable source evaluator and its mathematical polling domain.
 *
 * @author Samchon
 */
export interface IHumanSourcePatternSearchInput<T extends object> {
  initial: number[];
  maximumEvaluations: number;
  admit(parameters: readonly number[]): boolean;
  evaluate(parameters: readonly number[]): T;
  better(candidate: T, current: T): boolean;

  /** Stop at actual owner admission; the search never substitutes merit for it. */
  accepted(evaluation: T): boolean;

  /** Reports only completed uncached calls; no waiting or cache-hit heartbeat. */
  completed(event: IHumanSourcePatternEvaluation<T>): void;
}
