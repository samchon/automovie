import type { IAutoMovieHumanWebBranch } from "./IAutoMovieHumanWebBranch";

/** The second stage of a web's build: every child's columns and the number of rows they are drawn in.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The second stage of a web's build: every child's columns and the number of rows they are drawn in.
 * @evidence contracts/development/design.md#principled-representation `children`: Every child and its columns. `rows`: Rows from the parent's ring (row 0) to the children's sections (the last row). `crestRow`: The row of the crests.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanWebColumns.of. Read by AutoMovieHumanWebMesh.of. Also types AutoMovieHumanBodyWeb.columns.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `children`, `rows`, `crestRow`; callers supply the complete record.
 */
export interface IAutoMovieHumanWebColumns {
  /** Every child and its columns. */
  children: IAutoMovieHumanWebBranch[];

  /** Rows from the parent's ring (row 0) to the children's sections (the last row). */
  rows: number;

  /** The row of the crests. */
  crestRow: number;
}
