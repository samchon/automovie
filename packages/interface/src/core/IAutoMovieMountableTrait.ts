/**
 * Profile trait proving that other bodies can mount this one.
 *
 * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `IAutoMovieMountableTrait` as the portable data boundary for the motion object authored vocabulary requirement.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `IAutoMovieMountableTrait` for the performance interaction attachment object handoff system contract.
 */
export interface IAutoMovieMountableTrait {
  /**
   * Trait discriminator.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `kind` as the portable data boundary for the motion object authored vocabulary requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `kind` for the performance interaction attachment object handoff system contract.
   */
  kind: "mountable";

  /**
   * Positive simultaneous rider capacity.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `seats` as the portable data boundary for the motion object authored vocabulary requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `seats` for the performance interaction attachment object handoff system contract.
   */
  seats: number;

  /**
   * Maximum supported payload in kilograms.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `payloadMass` as the portable data boundary for the motion object authored vocabulary requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `payloadMass` for the performance interaction attachment object handoff system contract.
   */
  payloadMass: number;
}
