import { IAutoMovieShotPredicate } from "./IAutoMovieShotPredicate";

/**
 * A named opening or closing state required by a shot.
 *
 * @evidence contracts/development/design.md#principled-representation A stable identity and human contract accompany nonempty machine-checkable predicates sampled against compiled pose and transform output at the relevant shot boundary.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separates narrative explanation from executable predicates while using the same state shape for opening and closing requirements.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Description text is never measured as proof. Nonempty predicates are an authoring requirement; realizeShotContract applies every and an empty list passes vacuously, so callers must establish the list and predicate domains without the retired production gate.
 * @evidence contracts/development/common.md#meaningful-documentation Defines boundary-state identity, descriptive contract and the independent machine-checkable evidence obligation.
 */
export interface IAutoMovieNamedState {
  /** Stable state id. */
  id: string;

  /** Non-blank human-readable state contract; it is never proof by itself. */
  description: string;

  /**
   * Machine-checkable facts sampled from compiled pose and transform output.
   *
   * Descriptive prose never discharges a state contract by itself.
   */
  predicates: IAutoMovieShotPredicate[];
}
