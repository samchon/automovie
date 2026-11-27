import type { IAutoMovieIntent } from "./IAutoMovieIntent";

/**
 * Production-defined decisions evaluated by resolveOutcome in array
 * order. No vocabulary or rule-id validation is performed by the engine.
 */
export namespace IAutoMovieResolveOutcome {
  /** One ordered rule. */
  export interface IRule<Outcome extends string> {
    /** Stable rule id, reported with the outcome. */
    id: string;

    /**
     * Synchronous predicate over the caller's borrowed intent array. Called
     * once if reached, stops evaluation when true, must not mutate inputs, and
     * is not retained. Exceptions abort resolution unchanged.
     */
    when(intents: readonly IAutoMovieIntent[]): boolean;

    /** The outcome it decides. */
    outcome: Outcome;
  }

  /** A production's outcome table. */
  export interface ITable<Outcome extends string> {
    /**
     * Rules in priority order; the first accepting predicate wins. Empty rules
     * select otherwise.
     */
    rules: readonly IAutoMovieResolveOutcome.IRule<Outcome>[];

    /** The outcome when no rule decides. */
    otherwise: Outcome;
  }

  /**
   * The outcome of interacting intents from a production's own table: the first
   * rule whose predicate accepts the intents, else the table's default. The
   * engine only orders and applies the rules; their vocabulary and the outcome
   * classes are the production's.
   */
  export type IResult<Outcome extends string> = {
    /**
     * Winning rule's outcome, or the table's otherwise value; the returned
     * record is mutable.
     */
    outcome: Outcome;
    /** Winning rule id; omitted exactly when no predicate accepted. */
    rule?: string;
  };
}
