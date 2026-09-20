import { AutoMovieExpressionPreset } from "../expression/AutoMovieExpressionPreset";
import { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * Play a facial expression; engine: blendshape/expression channels.
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `IAutoMovieEmoteAction` as the portable data boundary for the story dialogue action interaction requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieEmoteAction` for the narrative intent utterance timing action system contract.
 */
export interface IAutoMovieEmoteAction extends IAutoMovieActionBase {
  /**
   * Selects a facial expression as the action family.
   *
   * @evidence requirements/actors/pose-expression-and-gaze.md#actor-expression-channels This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-pose-gaze-expression-state This action member carries the cited authoring intent in the typed action contract.
   */
  verb: "emote";

  /**
   * Named expression preset applied by the action.
   *
   * @evidence requirements/actors/pose-expression-and-gaze.md#actor-expression-channels This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-pose-gaze-expression-state This action member carries the cited authoring intent in the typed action contract.
   */
  preset: AutoMovieExpressionPreset;

  /**
   * Strength `[0,1]`.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `intensity` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `intensity` for the narrative intent utterance timing action system contract.
   */
  intensity: number;
}
