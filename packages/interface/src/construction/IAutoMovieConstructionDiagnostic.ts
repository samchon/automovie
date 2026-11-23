/**
 * A premise a construction node could not keep, recorded instead of failing the
 * whole solid.
 *
 * A view part's broken station is left out of its chain, a join, continuation
 * or trim that cannot keep its premises is left out with its host standing as
 * it was; the solid still realizes, and an empty diagnostic list is part of a
 * clean construction.
 */
export interface IAutoMovieConstructionDiagnostic {
  /**
   * The node that broke a premise: a view part's, a join's, a continuation's or
   * a trim's name.
   */
  node: string;

  /**
   * The premise it broke, such as `outline order`, `girth in reach`, `one loop
   * per contact` or `simple rail`.
   */
  contract: string;

  /** The message with its station, parameter and numbers. */
  detail: string;
}
