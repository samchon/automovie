import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * The actor root's shot-local world transform at one sampled instant.
 *
 * @evidence requirements/motion/root-motion-and-trajectories.md#motion-root-authority-mode Represents the actor root produced by the selected motion authority.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Defines the sampled world-frame result of procedural root trajectory resolution.
 * @author Samchon
 */
export interface IAutoMovieActorWorldFrame {
  /**
   * Actor-root position in world space.
   *
   * @evidence requirements/motion/root-motion-and-trajectories.md#motion-root-authority-mode Carries the world translation produced by the selected root authority.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Emits the sampled world root required by procedural trajectory consumers.
   */
  position: IAutoMovieVector3;
  /**
   * Actor-root orientation in world space.
   *
   * @evidence requirements/motion/root-motion-and-trajectories.md#motion-facing-travel Preserves root orientation independently from the translated travel path.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Carries the sampled root rotation used to interpret local target space.
   */
  rotation: IAutoMovieQuaternion;
  /**
   * Authored yaw in degrees retained for locomotion synthesis.
   *
   * @evidence requirements/motion/root-motion-and-trajectories.md#motion-facing-travel Exposes the resolved facing direction separately from root displacement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Reports the sampled facing state of the procedural trajectory.
   */
  facingDeg: number;
}
