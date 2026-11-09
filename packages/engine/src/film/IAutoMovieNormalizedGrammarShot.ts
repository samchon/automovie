import { AutoMovieGrammarStyleIntent } from "@automovie/interface";

import { IAutoMovieGrammarShotObservation } from "./IAutoMovieGrammarShotObservation";
import { IAutoMovieGrammarSubjectObservation } from "./IAutoMovieGrammarSubjectObservation";

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
 *
 * @evidence contracts/development/design.md#principled-representation Canonical order is code-unit order from `compareCodeUnits`, a total order independent of host locale, so two observations of the same edit normalize to the same value; the index is built from the sorted list after duplicate ids were refused, so every id maps to exactly one subject.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the observation's fields and replaces only the three whose input order carries no meaning, plus the index every cut and axis check reads, so the inspectors never re-sort or re-index.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No subject, shot or intent is special-cased; the canonical forms are the same rule for every observation.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, which fields are copied and which are canonicalized, the order used, and what the index guarantees.
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
