import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * React to being struck: the engine resolves the impact (`resolveImpact`) and
 * the ROM-bounded flinch/knock-back (`impactRecoil`). Usually emitted by the
 * engine from a {@link IAutoMovieLaunchAction}'s `onHit`; author it directly for
 * a melee blow whose timing you control.
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `IAutoMovieReactAction` as the portable data boundary for the story dialogue action interaction requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieReactAction` for the narrative intent utterance timing action system contract.
 */
export interface IAutoMovieReactAction extends IAutoMovieActionBase {
  /**
   * Selects an impact reaction as the action family.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-multi-subject-interaction This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-interaction-choreography-role This action member carries the cited authoring intent in the typed action contract.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `verb` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `verb` for the narrative intent utterance timing action system contract.
   */
  verb: "react";

  /**
   * Where the blow comes from.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `from` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `from` for the narrative intent utterance timing action system contract.
   */
  from: IAutoMovieActionTarget;

  /**
   * Force `[0,1]` (a graze vs. a knockout); the engine scales the impulse.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `force` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `force` for the narrative intent utterance timing action system contract.
   */
  force: number;

  /**
   * If it unseats/floors the actor (drives a fall within ROM + balance).
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `unbalance` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `unbalance` for the narrative intent utterance timing action system contract.
   */
  unbalance?: boolean;
}
