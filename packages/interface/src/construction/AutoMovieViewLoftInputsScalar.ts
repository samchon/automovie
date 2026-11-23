/**
 * Call-local reader of one original scalar outline at physical station in
 * millimetres. The containing field defines value units. It reuses its admitted
 * preparation; an outline read refusal reports its original source name and
 * returns NaN, while thrown getter exceptions propagate.
 */
export type AutoMovieViewLoftInputsScalar = (station: number) => number;
