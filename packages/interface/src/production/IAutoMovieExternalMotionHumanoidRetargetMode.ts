/**
 * Explicit humanoid retargeting of external motion.
 *
 * @evidence contracts/development/design.md#principled-representation The discriminator and finite positive translationScale retain an explicit source-to-target intent without deriving an unstated size choice. The retired production reader no longer passes these fields to Engine automatically; hosts own scale admission and conversion invocation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Mode and one scale are the retarget-only choices; source rig, node mapping and receiving actor remain on the enclosing adoption declaration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The engine cannot silently convert incompatible native motion using a guessed ratio; the author selects retarget mode and supplies the scale that changes root travel.
 * @evidence contracts/development/common.md#meaningful-documentation States explicit humanoid conversion and the positive finite translation multiplier, distinct from geometric model scaling or automatic source selection.
 */
export interface IAutoMovieExternalMotionHumanoidRetargetMode {
  /** Humanoid-retarget adoption discriminator. */
  kind: "humanoid-retarget";

  /** Explicit finite positive root-translation scale. */
  translationScale: number;
}
