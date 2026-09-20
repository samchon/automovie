import { IAutoMovieShotPredicate } from "./IAutoMovieShotPredicate";

/**
 * A named opening or closing state required by a shot.
 *
 * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `IAutoMovieNamedState` as the portable data boundary for the story time state review scope requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `IAutoMovieNamedState` for the narrative intent temporal state handoff system contract.
 */
export interface IAutoMovieNamedState {
  /**
   * Stable state id.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `id` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `id` for the narrative intent temporal state handoff system contract.
   */
  id: string;

  /**
   * Non-blank human-readable state contract; it is never proof by itself.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `description` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `description` for the narrative intent temporal state handoff system contract.
   */
  description: string;

  /**
   * Machine-checkable facts sampled from compiled pose and transform output.
   *
   * Descriptive prose never discharges a state contract by itself.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `predicates` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `predicates` for the narrative intent temporal state handoff system contract.
   */
  predicates: IAutoMovieShotPredicate[];
}
