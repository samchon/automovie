/**
 * Select the closed ends of a view part. Bottom closes the first station, top
 * the last, both closes each, and open keeps both ends open. A closed end reads
 * collapsed source lengths at its tip. The positive sections still need enough
 * admitted stations to form the loft.
 */
export type AutoMovieConstructionPole = "open" | "bottom" | "top" | "both";
