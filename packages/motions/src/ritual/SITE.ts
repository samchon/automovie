/**
 * How far from a region's centre the sign of the cross may land, metres: the patch a fingertip touch reaches (provisional).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the value, its unit and what it bounds.
 * @evidence contracts/development/design.md#principled-representation One authored tolerance of the sign of the cross, owned here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the value the helper reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The value is provisional and stated as such, not a tuned number.
 */
export const SITE: number = 0.06;
