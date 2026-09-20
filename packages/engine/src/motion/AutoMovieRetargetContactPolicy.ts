/**
 * How a retarget treats the contacts the source clip made.
 *
 * `"pin-source-contacts"` re-solves each contacting limb so the effector holds
 * the source contact mapped through `rootScale`; `"carry-joint-angles"` is v1's
 * verbatim angle copy, which foot-slides whenever the rigs differ in
 * proportion.
 *
 * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-contact-preservation Makes contact re-solving an explicit retarget policy rather than an implicit angle-copy side effect.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Selects whether the target rig re-establishes source contacts.
 */
export type AutoMovieRetargetContactPolicy =
  | "pin-source-contacts"
  | "carry-joint-angles";
