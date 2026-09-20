import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * The world position and orientation of one resolved chain bone.
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-target-space Carries a chain joint in the world frame used by the reach target.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Supplies the resolved frame from which chain reachability is measured.
 */
export interface IAutoMovieChainBone {
  /**
   * World-space bone origin.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-target-space Places the chain joint in the same space as its target.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Anchors world-space endpoint measurement for the chain solve.
   */
  worldPosition: IAutoMovieVector3;

  /**
   * World-space bone orientation.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-target-space Relates the world-space solution back to the bone's local articulation frame.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Lowers the selected world correction into the chain joint's local basis.
   */
  worldRotation: IAutoMovieQuaternion;
}
