/**
 * How long a genuflection rests on the knee, seconds (provisional).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the value, its unit and what it times.
 * @evidence contracts/development/design.md#principled-representation One authored timing of the genuflection, owned here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the value the helper reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The value is provisional and stated as such, not a tuned number.
 */
export const GENUFLECT_HOLD: number = 0.4;
