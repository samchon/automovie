/**
 * Rummaging strokes over the bag's floor before the item is taken
 * (provisional).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the value, its unit and what it counts.
 * @evidence contracts/development/design.md#principled-representation One authored count of the bag search, owned here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the value the helper reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The value is provisional and stated as such, not a tuned number.
 */
export const RUMMAGE: number = 3;
