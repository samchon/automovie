import { AutoMovieGestureKind } from "./AutoMovieGestureKind";
import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * A whole-body gesture from the engine's motion vocabulary. Pick the closest
 * `kind`; refine with `note`. The engine owns the keyframes; keep this intent,
 * not animation.
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `IAutoMovieGestureAction` as the portable data boundary for the story dialogue action interaction requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieGestureAction` for the narrative intent utterance timing action system contract.
 */
export interface IAutoMovieGestureAction extends IAutoMovieActionBase {
  /**
   * Selects a gesture as the action family.
   *
   * @evidence requirements/actors/performance-and-story-binding.md#actor-performance-capability-plan This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-story-performance-state This action member carries the cited authoring intent in the typed action contract.
   */
  verb: "gesture";

  /**
   * Gesture family named by the authored action.
   *
   * @evidence requirements/actors/performance-and-story-binding.md#actor-performance-capability-plan This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-story-performance-state This action member carries the cited authoring intent in the typed action contract.
   */
  kind: AutoMovieGestureKind;

  /**
   * Specialise the family ("jab" for `strike`, "roundhouse" for `kick`) or
   * describe a `custom` one.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `note` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `note` for the narrative intent utterance timing action system contract.
   */
  note?: string;

  /**
   * What the gesture is directed at (a strike's target, a wave's recipient).
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `at` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `at` for the narrative intent utterance timing action system contract.
   */
  at?: IAutoMovieActionTarget;
}
