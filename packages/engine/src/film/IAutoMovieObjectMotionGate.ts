import { IAutoMovieClip, IAutoMoviePropSpec, IAutoMovieScene } from "@automovie/interface";

/**
 * What one shot's authored object clips are checked against.
 *
 * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary IAutoMovieObjectMotionGate constrains authored object motion: What one shot's authored object clips are checked against.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAutoMovieObjectMotionGate realizes declared attachment and object handoff: What one shot's authored object clips are checked against.
 */
export interface IAutoMovieObjectMotionGate {
  /**
   * The staged scene, for the placements a clip may address.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary IAutoMovieObjectMotionGate.scene constrains authored object motion: The staged scene, for the placements a clip may address.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAutoMovieObjectMotionGate.scene realizes declared attachment and object handoff: The staged scene, for the placements a clip may address.
   */
  scene: IAutoMovieScene;

  /**
   * The shot's prop registry, whose articulation lowers the joint ids.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary IAutoMovieObjectMotionGate.props constrains authored object motion: The shot's prop registry, whose articulation lowers the joint ids.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAutoMovieObjectMotionGate.props realizes declared attachment and object handoff: The shot's prop registry, whose articulation lowers the joint ids.
   */
  props?: readonly IAutoMoviePropSpec[];

  /**
   * The clips the source authored.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary IAutoMovieObjectMotionGate.clips constrains authored object motion: The clips the source authored.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAutoMovieObjectMotionGate.clips realizes declared attachment and object handoff: The clips the source authored.
   */
  clips: readonly IAutoMovieClip[];

  /**
   * The object clips the engine baked for this shot (launched flights,
   * `attachTo` follows, staged mounts). Their ids and the channels they drive
   * are already spoken for.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary IAutoMovieObjectMotionGate.baked constrains authored object motion: The object clips the engine baked for this shot (launched flights, `attachTo` follows, staged mounts). Their ids and the channels they drive are already spoken for.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAutoMovieObjectMotionGate.baked realizes declared attachment and object handoff: The object clips the engine baked for this shot (launched flights, `attachTo` follows, staged mounts). Their ids and the channels they drive are already spoken for.
   */
  baked: readonly IAutoMovieClip[];

  /**
   * Scene nodes a compiled performance drives through the rig.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary IAutoMovieObjectMotionGate.performed constrains authored object motion: Scene nodes a compiled performance drives through the rig.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAutoMovieObjectMotionGate.performed realizes declared attachment and object handoff: Scene nodes a compiled performance drives through the rig.
   */
  performed: ReadonlySet<string>;

  /**
   * Shot length in seconds; a key outside it is never played.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary IAutoMovieObjectMotionGate.duration constrains authored object motion: Shot length in seconds; a key outside it is never played.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAutoMovieObjectMotionGate.duration realizes declared attachment and object handoff: Shot length in seconds; a key outside it is never played.
   */
  duration: number;

  /**
   * Authoring path the violations are reported against.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-interaction-refusal Carries the exact source path used to report why an authored object clip was refused.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAutoMovieObjectMotionGate.path realizes declared attachment and object handoff: Authoring path the violations are reported against.
   */
  path: string;
}
