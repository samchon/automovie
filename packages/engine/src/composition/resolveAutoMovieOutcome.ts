import type { IAutoMovieIntent } from "./IAutoMovieIntent";

/**
 * The outcome of interacting intents from a production's own table: the
 * first rule whose predicate accepts the intents, else the table's default.
 * The engine only orders and applies the rules; their vocabulary and the
 * outcome classes are the production's.
 *
 * @param table The production's outcome table.
 * @param intents The interacting intents, such as an action and its answer.
 * @returns The outcome and the id of the rule that decided it (absent for the default).
 */
export function resolveAutoMovieOutcome<Outcome extends string>(
  table: resolveAutoMovieOutcome.ITable<Outcome>,
  intents: readonly IAutoMovieIntent[],
): { outcome: Outcome; rule?: string } {
  for (const rule of table.rules)
    if (rule.when(intents)) return { outcome: rule.outcome, rule: rule.id };
  return { outcome: table.otherwise };
}
/** Companion types of {@link resolveAutoMovieOutcome}. */
export namespace resolveAutoMovieOutcome {
  /** One ordered rule. */
  export interface IRule<Outcome extends string> {
    /** Stable rule id, reported with the outcome. */
    id: string;

    /** Whether the rule decides these intents. */
    when(intents: readonly IAutoMovieIntent[]): boolean;

    /** The outcome it decides. */
    outcome: Outcome;
  }

  /** A production's outcome table. */
  export interface ITable<Outcome extends string> {
    /** Rules in priority order. */
    rules: readonly IRule<Outcome>[];

    /** The outcome when no rule decides. */
    otherwise: Outcome;
  }
}
