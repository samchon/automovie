import { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * Hold the current pose (a beat of stillness) for the duration.
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `IAutoMovieHoldAction` as the portable data boundary for the story dialogue action interaction requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieHoldAction` for the narrative intent utterance timing action system contract.
 */
export interface IAutoMovieHoldAction extends IAutoMovieActionBase {
  /**
   * Selects a pose hold as the action family.
   *
   * @evidence requirements/motion/timing-and-semantic-events.md#motion-story-film-time This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clock-semantic-event This action member carries the cited authoring intent in the typed action contract.
   */
  verb: "hold";

  /**
   * Shot-local length of the held pose in seconds.
   *
   * @evidence requirements/motion/timing-and-semantic-events.md#motion-story-film-time This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clock-semantic-event This action member carries the cited authoring intent in the typed action contract.
   */
  duration: number;
}
