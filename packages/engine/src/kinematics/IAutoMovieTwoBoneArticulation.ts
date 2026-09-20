import { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * The two bone-local articulation deltas a two-bone solve produces: apply
 * `upper` on the chain-root joint and `lower` on the mid joint (each lowered
 * into clinical angles by the caller's own axes/rest-frame conventions).
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-solve-order Encodes the bone-local correction pair produced by FK-to-IK lowering.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Carries the local two-joint result of the bounded chain solve.
 */
export interface IAutoMovieTwoBoneArticulation {
  /**
   * Bone-local articulation delta for the chain-root joint.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-solve-order Preserves the root correction before the mid-joint articulation is applied.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Carries the local rotation that aims the upper link into the bend plane.
   */
  upper: IAutoMovieQuaternion;

  /**
   * Bone-local articulation delta for the mid joint.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-solve-order Preserves the mid-joint correction after the upper link has been placed.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Carries the local rotation that closes the remaining endpoint distance.
   */
  lower: IAutoMovieQuaternion;
}
