import type { IAutoMovieIntent } from "./IAutoMovieIntent";

/** Production-defined decisions evaluated by resolveAutoMovieOutcome in array order. No vocabulary or rule-id validation is performed by the engine. */
export namespace IAutoMovieResolveOutcome {
  /**
   * One ordered rule.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents ordered predicate execution, borrowed inputs and exception propagation.
   * @evidence contracts/development/design.md#principled-representation The outcome type parameter preserves the production's string vocabulary; id identifies the first accepting rule.
   * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieOutcome invokes when synchronously at most once if reached, retaining neither rule nor predicate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A rule returns an existing outcome value and carries no global registry or renderer dependency.
   */
  export interface IRule<Outcome extends string> {
    /** Stable rule id, reported with the outcome. */
    id: string;

    /** Synchronous predicate over the caller's borrowed intent array. Called once if reached, stops evaluation when true, must not mutate inputs, and is not retained. Exceptions abort resolution unchanged. */
    when(intents: readonly IAutoMovieIntent[]): boolean;

    /** The outcome it decides. */
    outcome: Outcome;
  }

  /**
   * A production's outcome table.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States priority ordering and fallback behavior for no accepted rules.
   * @evidence contracts/development/design.md#principled-representation A readonly rule sequence and mandatory otherwise value ensure every completed evaluation has an outcome, including an empty table.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The production owns its rule vocabulary and priority; resolveAutoMovieOutcome applies that order without validating ids.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The fallback is explicit instead of an optional outcome that would require an invented engine default.
   */
  export interface ITable<Outcome extends string> {
    /** Rules in priority order; the first accepting predicate wins. Empty rules select otherwise. */
    rules: readonly IAutoMovieResolveOutcome.IRule<Outcome>[];

    /** The outcome when no rule decides. */
    otherwise: Outcome;
  }

  /**
   * The outcome of interacting intents from a production's own table: the
   * first rule whose predicate accepts the intents, else the table's default.
   * The engine only orders and applies the rules; their vocabulary and the
   * outcome classes are the production's.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a winning rule from the default and identifies result mutability.
   * @evidence contracts/development/design.md#principled-representation outcome is always present and rule is absent only when every predicate refused; values share the table's outcome vocabulary.
   * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieOutcome creates this reporting record for the caller and retains no predicate state.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The optional rule is provenance, not an alternative result payload or an unresolved decision.
   */
  export type IResult<Outcome extends string> = {
    /** Winning rule's outcome, or the table's otherwise value; the returned record is mutable. */
    outcome: Outcome;
    /** Winning rule id; omitted exactly when no predicate accepted. */
    rule?: string;
  };
}
