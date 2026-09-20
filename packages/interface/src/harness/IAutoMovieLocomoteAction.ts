import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Travel across the floor on a gait; engine: locomotion + `travelMotion`.
 *
 * `gait` names one of the gaits the actor's context actually supplies
 * ({@link IAutoMovieGait.name}); it is matched by name, so the vocabulary is the
 * actor's own, not a fixed set: a biped declares `walk`/`run`/`sprint`/
 * `sneak`/`march`, a horse declares `walk`/`trot`/`canter`/`gallop`, a cat
 * `walk`/`stalk`/`pounce`. Naming a gait the actor did not supply is a
 * validation error (the shot's perform gate reports it), not a silent freeze,
 * so the schema's free string cannot drift from the runtime's actual set.
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `IAutoMovieLocomoteAction` as the portable data boundary for the story dialogue action interaction requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieLocomoteAction` for the narrative intent utterance timing action system contract.
 */
export interface IAutoMovieLocomoteAction extends IAutoMovieActionBase {
  /**
   * Selects locomotion as the action family.
   *
   * @evidence requirements/motion/root-motion-and-trajectories.md#motion-root-authority-mode This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule This action member carries the cited authoring intent in the typed action contract.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `verb` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `verb` for the narrative intent utterance timing action system contract.
   */
  verb: "locomote";

  /**
   * Name of the actor-provided gait used for the travel action.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule This action member carries the cited authoring intent in the typed action contract.
   */
  gait: string;

  /**
   * Where to go (the engine sizes the gait cycles to cover the distance).
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `to` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `to` for the narrative intent utterance timing action system contract.
   */
  to: IAutoMovieActionTarget;

  /**
   * Face the travel direction (false keeps facing a separate look target).
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `faceTravel` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `faceTravel` for the narrative intent utterance timing action system contract.
   */
  faceTravel?: boolean;
}
