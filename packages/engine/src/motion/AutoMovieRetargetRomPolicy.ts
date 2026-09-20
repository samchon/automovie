/**
 * ROM priority used by the retargeted clip's validation pass.
 *
 * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-refusal Requires the converted clip to satisfy the target rig's effective range policy.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Names the ROM authority used to accept or reject the retarget.
 */
export type AutoMovieRetargetRomPolicy =
  "target-override-then-default-humanoid";
