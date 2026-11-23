/**
 * Seconds a pulse is felt for (the 10 s check of AHA 2020 basic life support).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the value, its unit and its source.
 * @evidence contracts/development/design.md#principled-representation One sourced constant of the first-aid guideline, owned here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the value the care helper reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The value is the cited guideline's, not a tuned number.
 */
export const PULSE_HOLD: number = 10;
