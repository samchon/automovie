/**
 * Explicit humanoid retargeting of external motion.
 *
 * @evidence contracts/common.md#principled-implementation The discriminator and finite positive translationScale retain an explicit source-to-target intent without deriving an unstated size choice. The retired production reader no longer passes these fields to Engine automatically; hosts own scale admission and conversion invocation.
 * @evidence contracts/common.md#clear-and-simple-design Mode and one scale are the retarget-only choices; source rig, node mapping and receiving actor remain on the enclosing adoption declaration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine cannot silently convert incompatible native motion using a guessed ratio; the author selects retarget mode and supplies the scale that changes root travel.
 * @evidence contracts/common.md#meaningful-documentation States explicit humanoid conversion and the positive finite translation multiplier, distinct from geometric model scaling or automatic source selection.
 */
export interface IAutoMovieExternalMotionHumanoidRetargetMode {
  /** Humanoid-retarget adoption discriminator. */
  kind: "humanoid-retarget";

  /** Explicit finite positive root-translation scale. */
  translationScale: number;
}
