/**
 * Read one prepared outline at the requested physical station in millimetres.
 * The containing field specifies the scalar units. If the outline returns a
 * read failure, the reader reports its source name and returns NaN. Exceptions
 * from reading or reporting propagate.
 */
export type AutoMovieViewLoftInputsScalar = (station: number) => number;
