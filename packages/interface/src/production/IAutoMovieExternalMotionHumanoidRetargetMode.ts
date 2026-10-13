/**
 * Explicit humanoid retargeting of external motion.
 *
 * @evidence contracts/common.md#principled-implementation The humanoid-retarget discriminator explicitly authorizes source-to-target clinical-angle conversion with a finite positive root-translation scale, which production passes to the engine instead of deriving an unstated size choice.
 * @evidence contracts/common.md#clear-and-simple-design Mode and one scale are the retarget-only choices; source rig, node mapping and receiving actor remain on the enclosing adoption declaration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine cannot silently convert incompatible native motion using a guessed ratio; the author selects retarget mode and supplies the scale that changes root travel.
 * @evidence contracts/common.md#meaningful-documentation States explicit humanoid conversion and the positive finite translation multiplier, distinct from geometric model scaling or automatic source selection.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionHumanoidRetargetMode {
  /** Humanoid-retarget adoption discriminator. */
  kind: "humanoid-retarget";

  /** Explicit finite positive root-translation scale. */
  translationScale: number;
}
