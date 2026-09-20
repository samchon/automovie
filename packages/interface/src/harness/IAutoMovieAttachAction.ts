import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * Rigidly couple this actor to another node's bone for the action's span: a
 * sword in a hand, a prop carried. Engine: `resolveAttachment`. (A _persistent_
 * mount, e.g. a rider on a horse, is better declared once in staging than
 * repeated as an action every shot.)
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `IAutoMovieAttachAction` as the portable data boundary for the story dialogue action interaction requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieAttachAction` for the narrative intent utterance timing action system contract.
 */
export interface IAutoMovieAttachAction extends IAutoMovieActionBase {
  /**
   * Selects an attachment as the action family.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-handoff This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff This action member carries the cited authoring intent in the typed action contract.
   */
  verb: "attachTo";

  /**
   * Scene node that owns the attachment bone.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-coupled-objects This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff This action member carries the cited authoring intent in the typed action contract.
   */
  parent: string;

  /**
   * Semantic bone on the parent to which the actor is attached.
   *
   * @evidence requirements/actors/appearance-costume-and-attachments.md#actor-attachment-contact This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff This action member carries the cited authoring intent in the typed action contract.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `bone` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `bone` for the narrative intent utterance timing action system contract.
   */
  bone: AutoMovieHumanoidBone;
}
