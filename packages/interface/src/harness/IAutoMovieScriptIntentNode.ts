import { IAutoMovieIntentPayload } from "./IAutoMovieIntentPayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * The intent root: the film's single top thought.
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-timing-intent Exposes `IAutoMovieScriptIntentNode` as the portable data boundary for the story dialogue timing intent requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieScriptIntentNode` for the narrative intent utterance timing action system contract.
 */
export interface IAutoMovieScriptIntentNode extends IAutoMovieScriptNodeBase {
  /**
   * Discriminator.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-timing-intent Exposes `kind` as the portable data boundary for the story dialogue timing intent requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `kind` for the narrative intent utterance timing action system contract.
   */
  kind: "intent";

  /**
   * What this level of thought carries (D014: no uniform CoT slots).
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-timing-intent Exposes `payload` as the portable data boundary for the story dialogue timing intent requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `payload` for the narrative intent utterance timing action system contract.
   */
  payload: IAutoMovieIntentPayload;
}
