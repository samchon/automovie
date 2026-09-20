import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Turn the head/eyes to track a target; engine: `aimRotation` look-at.
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `IAutoMovieLookAtAction` as the portable data boundary for the story dialogue action interaction requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieLookAtAction` for the narrative intent utterance timing action system contract.
 */
export interface IAutoMovieLookAtAction extends IAutoMovieActionBase {
  /**
   * Selects gaze tracking as the action family.
   *
   * @evidence requirements/actors/pose-expression-and-gaze.md#actor-gaze-attention This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-gaze-expression-attention This action member carries the cited authoring intent in the typed action contract.
   */
  verb: "lookAt";

  /**
   * Target to which the actor directs its gaze.
   *
   * @evidence requirements/actors/pose-expression-and-gaze.md#actor-gaze-attention This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-gaze-expression-attention This action member carries the cited authoring intent in the typed action contract.
   */
  to: IAutoMovieActionTarget;
}
