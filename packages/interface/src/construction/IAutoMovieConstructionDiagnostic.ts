/**
 * A premise a construction node could not keep, recorded instead of failing the whole solid.
 *
 * A view part's broken station is left out of its chain, a join, continuation or trim that cannot keep its premises is left out with its host standing as it was; the solid still realizes, and an empty diagnostic list is part of a clean construction.
 *
 * @evidence contracts/development/design.md#principled-representation Totality: every valid tree realizes, and each departure from it names the node and the premise with its numbers, so the author fixes the input that broke it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A node name, a contract name and a message are all a reader needs to find the cause.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A diagnostic is never suppressed by a fallback shape: the node it names is left out.
 * @evidence contracts/development/common.md#meaningful-documentation States what is left out for each node kind, that the solid still realizes and each field's meaning.
 */
export interface IAutoMovieConstructionDiagnostic {
  /** The node that broke a premise: a view part's, a join's, a continuation's or a trim's name. */
  node: string;

  /** The premise it broke, such as `outline order`, `girth in reach`, `one loop per contact` or `simple rail`. */
  contract: string;

  /** The message with its station, parameter and numbers. */
  detail: string;
}
