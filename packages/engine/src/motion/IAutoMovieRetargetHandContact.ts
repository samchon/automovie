import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * One declared hand contact: the arm chain and the clip window over which its
 * hand is touching something.
 *
 * Feet are detected geometrically against the ground, but a hand has no such
 * reference: a hand on a table, a wall, or a partner is indistinguishable from
 * a hand in the air by position alone. So a hand contact is **declared**, never
 * inferred.
 *
 * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Declares the arm chain and authored interval whose hand contact must survive retargeting.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Supplies an explicit non-ground contact for target-rig re-solving.
 * @author Samchon
 */
export interface IAutoMovieRetargetHandContact {
  /**
   * Hand end-effector bone held on its source contact.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Identifies the source effector whose mapped world contact is preserved.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Selects the target hand measured after the retarget solve.
   */
  hand: AutoMovieHumanoidBone;

  /**
   * Chain-root segment (upper arm).
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Anchors contact correction at the corresponding proximal arm segment.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Establishes the first link of the target contact chain.
   */
  upper: AutoMovieHumanoidBone;

  /**
   * Mid segment (forearm).
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Identifies the hinge segment adjusted to recover the mapped hand position.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Establishes the second link of the target contact chain.
   */
  lower: AutoMovieHumanoidBone;

  /**
   * Inclusive contact-window start, seconds on the clip's own clock.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Opens the authored interval in which the hand contact must be re-solved.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Aligns contact correction with the source clip clock.
   */
  start: number;

  /**
   * Inclusive contact-window end, seconds on the clip's own clock.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Closes the authored interval after which the hand may release.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Bounds target-rig correction to the declared source contact.
   */
  end: number;
}
