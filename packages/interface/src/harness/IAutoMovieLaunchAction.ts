import { IAutoMovieOnHitReaction } from "./IAutoMovieOnHitReaction";
import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Loose a projectile toward a target; engine: `projectileAt` +
 * `projectileSphereHit` (it leads a moving target). Because the **contact time
 * is computed by the engine**, the model cannot hand-time the target's
 * reaction; instead give `onHit`, and the engine schedules the target's `react`
 * at the **detected** moment of impact (the reactive event: "shoot him off his
 * horse" without knowing when the arrow lands).
 *
 * @evidence requirements/story/beats-and-causality.md#story-action-reaction Exposes `IAutoMovieLaunchAction` as the portable data boundary for the story action reaction requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-action-reaction-knowledge Types `IAutoMovieLaunchAction` for the narrative intent action reaction knowledge system contract.
 */
export interface IAutoMovieLaunchAction extends IAutoMovieActionBase {
  /**
   * Selects a projectile launch as the action family.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-multi-subject-interaction This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-interaction-choreography-role This action member carries the cited authoring intent in the typed action contract.
   *
   * @evidence requirements/story/beats-and-causality.md#story-action-reaction Exposes `verb` as the portable data boundary for the story action reaction requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-action-reaction-knowledge Types `verb` for the narrative intent action reaction knowledge system contract.
   */
  verb: "launch";

  /**
   * What is thrown (a scene-node prop, or a named projectile).
   *
   * @evidence requirements/story/beats-and-causality.md#story-action-reaction Exposes `projectile` as the portable data boundary for the story action reaction requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-action-reaction-knowledge Types `projectile` for the narrative intent action reaction knowledge system contract.
   */
  projectile: string;

  /**
   * Who/what it is aimed at.
   *
   * @evidence requirements/story/beats-and-causality.md#story-action-reaction Exposes `at` as the portable data boundary for the story action reaction requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-action-reaction-knowledge Types `at` for the narrative intent action reaction knowledge system contract.
   */
  at: IAutoMovieActionTarget;

  /**
   * Launch speed (m/s).
   *
   * @evidence requirements/story/beats-and-causality.md#story-action-reaction Exposes `speed` as the portable data boundary for the story action reaction requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-action-reaction-knowledge Types `speed` for the narrative intent action reaction knowledge system contract.
   */
  speed: number;

  /**
   * The reaction the engine applies to the struck target at the detected hit.
   *
   * @evidence requirements/story/beats-and-causality.md#story-action-reaction Exposes `onHit` as the portable data boundary for the story action reaction requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-action-reaction-knowledge Types `onHit` for the narrative intent action reaction knowledge system contract.
   */
  onHit?: IAutoMovieOnHitReaction;
}
