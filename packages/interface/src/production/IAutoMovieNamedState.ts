import { IAutoMovieShotPredicate } from "./IAutoMovieShotPredicate";

/**
 * A named opening or closing state required by a shot.
 *
 * @evidence contracts/common.md#principled-implementation A stable identity and human contract accompany nonempty machine-checkable predicates sampled against compiled pose and transform output at the relevant shot boundary.
 * @evidence contracts/common.md#clear-and-simple-design Separates narrative explanation from executable predicates while using the same state shape for opening and closing requirements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Description text is never measured as proof. Nonempty predicates are an authoring requirement; realizeShotContract applies every and an empty list passes vacuously, so callers must establish the list and predicate domains without the retired production gate.
 * @evidence contracts/common.md#meaningful-documentation Defines boundary-state identity, descriptive contract and the independent machine-checkable evidence obligation.
 * @author Samchon
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
