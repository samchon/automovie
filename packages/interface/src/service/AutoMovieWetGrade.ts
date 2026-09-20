/**
 * How much water a region is expected to see.
 *
 * The grades are ordered, and the order is what a threshold is checked against:
 * a boundary between two regions of the same grade is not a wet/dry boundary,
 * and one between different grades is.
 *
 * @evidence requirements/interior/wet-areas-and-waterproofing.md#interior-wet-dry-transition Exposes `AutoMovieWetGrade` as the portable data boundary for the interior wet dry transition requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-wet-zone-waterproofing Types `AutoMovieWetGrade` for the interior space wet zone waterproofing system contract.
 */
export type AutoMovieWetGrade = "dry" | "damp" | "wet" | "immersed";
