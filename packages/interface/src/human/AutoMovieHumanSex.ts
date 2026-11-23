/**
 * Sex category associated with requested reference statistics.
 *
 * This category distinguishes female and male population statistics. It does
 * not specify detailed body measurements or the continuous masculine/feminine
 * shape coordinate.
 */
export type AutoMovieHumanSex =
  /** Female population statistics. */
  | "female"
  /** Male population statistics. */
  | "male";
