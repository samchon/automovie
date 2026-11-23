import type { AutoMovieGrammarStyleIntent } from "../production/AutoMovieGrammarStyleIntent";
import type { IAutoMovieGrammarShotObservation } from "./IAutoMovieGrammarShotObservation";
import type { IAutoMovieGrammarSubjectObservation } from "./IAutoMovieGrammarSubjectObservation";

/**
 * One shot observation after `normalizeGrammarShot` has validated it and put
 * every order-free collection into a canonical order, the form the film-grammar
 * read inspects.
 *
 * The camera samples, duration, primary subject and declared size are the
 * observation's own values. The subjects are sorted by id and indexed once, and
 * the action axis is stored with its endpoints sorted, so neither the order a
 * producer listed subjects in nor the order it named the axis can change a
 * finding.
 */
export interface IAutoMovieNormalizedGrammarShot extends Omit<
  IAutoMovieGrammarShotObservation,
  "subjects" | "actionAxis" | "styleIntent"
> {
  /** The observed subjects, sorted by id in code-unit order. */
  subjects: IAutoMovieGrammarSubjectObservation[];

  /** The same subjects keyed by their unique id. */
  subjectById: ReadonlyMap<string, IAutoMovieGrammarSubjectObservation>;

  /**
   * The line of action with its two distinct, observed endpoints sorted by id,
   * or null when the shot states none.
   */
  actionAxis: readonly [string, string] | null;

  /** Declared exceptions in declaration order, each once; empty when absent. */
  styleIntent: AutoMovieGrammarStyleIntent[];
}
