import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Reach a hand to a target; engine: two-bone IK (`solveTwoBoneIK`). A
 * humanoid-rig verb (left/right arm); a quadruped pawing at something uses
 * `gesture` (`paw`) instead.
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `IAutoMovieReachAction` as the portable data boundary for the story dialogue action interaction requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieReachAction` for the narrative intent utterance timing action system contract.
 */
export interface IAutoMovieReachAction extends IAutoMovieActionBase {
  /**
   * Selects a reach as the action family.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-reachability This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph This action member carries the cited authoring intent in the typed action contract.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `verb` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `verb` for the narrative intent utterance timing action system contract.
   */
  verb: "reach";

  /**
   * Side of the actor that reaches for the target.
   *
   * @evidence requirements/actors/body-scale-and-landmarks.md#actor-left-right-asymmetry This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-semantic-joint-mapping This action member carries the cited authoring intent in the typed action contract.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `hand` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `hand` for the narrative intent utterance timing action system contract.
   */
  hand: "left" | "right";

  /**
   * Spatial target that the selected hand attempts to reach.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-target-space This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph This action member carries the cited authoring intent in the typed action contract.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `to` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `to` for the narrative intent utterance timing action system contract.
   */
  to: IAutoMovieActionTarget;
}
