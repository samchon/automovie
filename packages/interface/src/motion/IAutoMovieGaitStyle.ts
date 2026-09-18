/**
 * Coarse creature-style hints attached to a gait.
 *
 * These are normalized multipliers, not physical units: the engine interprets
 * them relative to the target rig and gait. They keep "sneaky", "heavy", or
 * "springy" in data instead of hand-authored TypeScript clips.
 *
 * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Exposes `IAutoMovieGaitStyle` as the portable data boundary for the motion gait table requirement.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Types `IAutoMovieGaitStyle` for the performance kinematics procedural gait rule system contract.
 * @author Samchon
 */
export interface IAutoMovieGaitStyle {
  /**
   * Lower the body during the gait. `0` = neutral, `1` = maximum crouch.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Exposes `crouch` as the portable data boundary for the motion gait table requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Types `crouch` for the performance kinematics procedural gait rule system contract.
   */
  crouch?: number;

  /**
   * Heavier movement feel. `0` = neutral, `1` = maximum weight.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Exposes `weight` as the portable data boundary for the motion gait table requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Types `weight` for the performance kinematics procedural gait rule system contract.
   */
  weight?: number;

  /**
   * Extra bounce/rebound. `0` = neutral, `1` = maximum spring.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Exposes `springiness` as the portable data boundary for the motion gait table requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Types `springiness` for the performance kinematics procedural gait rule system contract.
   */
  springiness?: number;

  /**
   * Relative stride length. `1` = neutral, below/above shortens/extends.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Exposes `strideScale` as the portable data boundary for the motion gait table requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Types `strideScale` for the performance kinematics procedural gait rule system contract.
   */
  strideScale?: number;
}
