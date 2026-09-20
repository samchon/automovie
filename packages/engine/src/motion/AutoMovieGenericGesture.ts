/**
 * The postural/expressive gestures the reference synthesiser can author.
 *
 * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-general-procedural-control Defines the bounded gesture vocabulary accepted by this procedural controller.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Keeps non-gait procedural controls explicit and reproducible.
 */
export type AutoMovieGenericGesture =
  | "bow"
  | "nod"
  | "shake"
  | "crouch"
  | "kick"
  | "stagger"
  | "wave"
  | "celebrate"
  | "draw"
  | "throw";
