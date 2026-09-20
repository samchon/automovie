import { IAutoMovieRetargetHandContact } from "./IAutoMovieRetargetHandContact";

/**
 * Contact policy input for {@link retargetHumanoidMotion}. Every field is
 * optional: the pass runs with humanoid legs and no declared hand contact
 * unless the caller says otherwise.
 *
 * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Carries the caller's target-contact preservation choices into the retarget pass.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Defines how source contacts are detected and re-established on the target rig.
 * @author Samchon
 */
export interface IAutoMovieRetargetContactProps {
  /**
   * Run the contact-preserving pass. Defaults to `true`; `false` restores v1's
   * verbatim angle copy.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Allows explicit adoption or omission of the contact re-solve.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Selects the target-contact stage without changing the source clip.
   */
  enabled?: boolean;

  /**
   * Ground height for source stance detection: a plane scalar or an `(x, z) →
   * y` source. Defaults to the **source rig's own rest floor** (the lowest
   * world Y of its zero pose), so a rig authored with its feet above the origin
   * still detects stance instead of never touching down.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Establishes the source-space ground authority used to discover foot contacts.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Supplies the ground reference from which contacts are mapped to the target.
   */
  groundY?: number | ((x: number, z: number) => number);

  /**
   * Contact tolerance above the ground counted as stance, in source model
   * units. Defaults to `0.02`, the same band {@link plantStanceFeet} and
   * {@link validateGroundContact} use. It doubles as the residual budget: a
   * pinned effector that ends further than `tolerance * rootScale` from its
   * contact is reported as a plausibility warning.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Bounds both source contact detection and the acceptable target residual.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Defines the numeric budget for preserving a mapped contact.
   */
  tolerance?: number;

  /**
   * Hand contacts to preserve. Defaults to none.
   *
   * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Lists the non-ground contacts explicitly selected for re-solving.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Adds authored hand constraints to the target retarget solve.
   */
  hands?: readonly IAutoMovieRetargetHandContact[];
}
