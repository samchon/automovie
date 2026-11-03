import type { IAutoMovieHumanWebBranch } from "./IAutoMovieHumanWebBranch";

/** The second stage of a web's build: every child's columns and the number of rows they are drawn in. */
export interface IAutoMovieHumanWebColumns {
  /** Every child and its columns. */
  children: IAutoMovieHumanWebBranch[];

  /** Rows from the parent's ring (row 0) to the children's sections (the last row). */
  rows: number;

  /** The row of the crests. */
  crestRow: number;
}
