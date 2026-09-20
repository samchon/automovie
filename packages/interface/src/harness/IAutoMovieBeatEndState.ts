import { IAutoMovieBeatEndActorState } from "./IAutoMovieBeatEndActorState";

/**
 * Resolved forward-state produced by one completed beat.
 *
 * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `IAutoMovieBeatEndState` as the portable data boundary for the story time state review scope requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `IAutoMovieBeatEndState` for the narrative intent temporal state handoff system contract.
 */
export interface IAutoMovieBeatEndState {
  /**
   * Beat id whose end-state this describes.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `beat` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `beat` for the narrative intent temporal state handoff system contract.
   */
  beat: string;

  /**
   * Shot id that realized the beat.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `shot` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `shot` for the narrative intent temporal state handoff system contract.
   */
  shot: string;

  /**
   * Per actor end-state, in scene node order.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `actors` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `actors` for the narrative intent temporal state handoff system contract.
   */
  actors: IAutoMovieBeatEndActorState[];
}
