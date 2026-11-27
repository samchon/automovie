import type {
  IAutoMovieIntent,
  IAutoMovieResolveOutcome,
} from "@automovie/interface";

/*
 * The outcome of interacting intents from a production's own table: the first
 * rule whose predicate accepts the intents, else the table's default. The
 * engine only orders and applies the rules; their vocabulary and the outcome
 * classes are the production's.
 * Parameter table: The production's outcome table.
 * Parameter intents: The interacting intents, such as an action and its answer.
 * Returns: The outcome and the id of the rule that decided it (absent for the
 * default).
 */
export function resolveAutoMovieOutcome<Outcome extends string>(
  table: IAutoMovieResolveOutcome.ITable<Outcome>,
  intents: readonly IAutoMovieIntent[],
): IAutoMovieResolveOutcome.IResult<Outcome> {
  for (const rule of table.rules)
    if (rule.when(intents)) return { outcome: rule.outcome, rule: rule.id };
  return { outcome: table.otherwise };
}
