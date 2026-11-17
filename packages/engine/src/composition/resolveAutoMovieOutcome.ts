import type { IAutoMovieIntent, IAutoMovieResolveOutcome } from "@automovie/interface";


/**
 * The outcome of interacting intents from a production's own table: the
 * first rule whose predicate accepts the intents, else the table's default.
 * The engine only orders and applies the rules; their vocabulary and the
 * outcome classes are the production's.
 *
 * @param table The production's outcome table.
 * @param intents The interacting intents, such as an action and its answer.
 * @returns The outcome and the id of the rule that decided it (absent for the default).
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (The outcome of interacting intents from a production's own table: the first rule whose predicate accepts the intents, else the table's default) and documents parameters `table`, `intents`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (The outcome of interacting intents from a production's own table: the first rule whose predicate accepts the intents, else the table's default) directly over its typed inputs (`table`, `intents`) as a single pass (for-of over table.rules), delegating to `rule.when`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 5 lines and 2 top-level statements that reuses `rule.when` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `table`, `intents`; the dominant cost is a single pass (for-of over table.rules), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function resolveAutoMovieOutcome<Outcome extends string>(
  table: IAutoMovieResolveOutcome.ITable<Outcome>,
  intents: readonly IAutoMovieIntent[],
): IAutoMovieResolveOutcome.IResult<Outcome> {
  for (const rule of table.rules)
    if (rule.when(intents)) return { outcome: rule.outcome, rule: rule.id };
  return { outcome: table.otherwise };
}
