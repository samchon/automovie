import { type IAutoMovieAuditOutcome, type IAutoMovieResolveOutcome, type IAutoMovieIntent } from "@automovie/interface";
import { auditAutoMovieOutcome as auditAutoMovieOutcomeImplementation } from "./internal/auditAutoMovieOutcome";
import { resolveAutoMovieOutcome as resolveAutoMovieOutcomeImplementation } from "./internal/resolveAutoMovieOutcome";

/** Public operations for Auto Movie Engine Composition Outcome. */
export namespace AutoMovieEngineCompositionOutcome {
  /**
   * Audit a declared outcome against measured contacts, failing and never
   * rewriting: every expected contact must be measured between its subjects (and
   * regions, when named) within its window with at least its impulse, and every
   * forbidden contact must be absent. The findings name each mismatch; an empty
   * list means the measurement supports the outcome.
   *
   * @param outcome The outcome's contact expectations.
   * @param contacts The measured contacts, such as physics receipts mapped to
   *   subjects.
   * @returns One finding per mismatch.
   */
  export function audit(outcome: IAutoMovieAuditOutcome.IOutcome, contacts: readonly IAutoMovieAuditOutcome.IContact[]): string[] {
    return auditAutoMovieOutcomeImplementation(outcome, contacts);
  }

  /**
   * The outcome of interacting intents from a production's own table: the first
   * rule whose predicate accepts the intents, else the table's default. The
   * engine only orders and applies the rules; their vocabulary and the outcome
   * classes are the production's.
   *
   * @param table The production's outcome table.
   * @param intents The interacting intents, such as an action and its answer.
   * @returns The outcome and the id of the rule that decided it (absent for the
   *   default).
   */
  export function resolve<Outcome extends string>(table: IAutoMovieResolveOutcome.ITable<Outcome>, intents: readonly IAutoMovieIntent[]): IAutoMovieResolveOutcome.IResult<Outcome> {
    return resolveAutoMovieOutcomeImplementation<Outcome>(table, intents);
  }
}
