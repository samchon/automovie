/**
 * How much water a region is expected to see.
 *
 * The grades are ordered, and the order is what a threshold is checked against: a boundary between two regions of the same grade is not a wet/dry boundary, and one between different grades is.
 *
 * @evidence contracts/development/design.md#principled-representation Wet validation orders dry, damp, wet and immersed ordinally to detect handovers to drier spaces; wet and immersed activate full declared tanking obligations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four semantic exposure grades describe waterproofing responsibility without embedding a measured water-volume threshold.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Grade order is ordinal, not liters or a simulated flooding result; rendered tile appearance cannot prove membrane or sealed-sleeve obligations.
 * @evidence contracts/development/common.md#meaningful-documentation Defines ordered expected exposure and differing-grade boundary meaning.
 */
export type AutoMovieWetGrade = "dry" | "damp" | "wet" | "immersed";
