/**
 * Explicit humanoid retargeting of external motion.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionHumanoidRetargetMode {
  /** Humanoid-retarget adoption discriminator. */
  kind: "humanoid-retarget";

  /** Explicit finite positive root-translation scale. */
  translationScale: number;
}
