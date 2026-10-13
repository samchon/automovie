/**
 * How much water a region is expected to see.
 *
 * The grades are ordered, and the order is what a threshold is checked against:
 * a boundary between two regions of the same grade is not a wet/dry boundary,
 * and one between different grades is.
 */
export type AutoMovieWetGrade = "dry" | "damp" | "wet" | "immersed";
