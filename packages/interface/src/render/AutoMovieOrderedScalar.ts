/**
 * One comparable leaf value in an ordered plan field.
 *
 * `equalOrderedScalars` compares arrays of these, or arrays of arrays of them,
 * position by position. The two fields it serves are a WAVE speaker label
 * array, whose leaves are strings, and a downmix matrix, whose leaves are
 * numbers; naming the leaf type keeps a record or other value out of that
 * comparison at compile time.
 */
export type AutoMovieOrderedScalar = number | string;
