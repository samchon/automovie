/**
 * The intent payload, the refinement root's thought: what film this is and what
 * it should feel like. The whole tree below refines this single statement, so
 * it carries only the top-of-funnel decomposition.
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-timing-intent Exposes `IAutoMovieIntentPayload` as the portable data boundary for the story dialogue timing intent requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieIntentPayload` for the narrative intent utterance timing action system contract.
 */
export interface IAutoMovieIntentPayload {
  /**
   * One-sentence summary of the film.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-timing-intent Exposes `logline` as the portable data boundary for the story dialogue timing intent requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `logline` for the narrative intent utterance timing action system contract.
   */
  logline: string;

  /**
   * The mood / thematic intent every refinement below should serve.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-timing-intent Exposes `theme` as the portable data boundary for the story dialogue timing intent requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `theme` for the narrative intent utterance timing action system contract.
   */
  theme: string;
}
