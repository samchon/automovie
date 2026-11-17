import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";
import type { IAutoMovieHumanWebChild } from "./IAutoMovieHumanWebChild";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";

/** The third stage of a web's build: the surface's laws, the points a row of a column takes.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The third stage of a web's build: the surface's laws, the points a row of a column takes.
 * @evidence contracts/development/design.md#principled-representation `levelOf`: A row's level in the chart of a web's child. `rowOf`: The row at a level of the chart of a web's child: the inverse of `levelOf`. `lip`: A margin's lip at a depth past the ring, as a share of its radius.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanWebSurface.of. Read by AutoMovieHumanWebMesh.of. Also types AutoMovieHumanBodyWeb.surface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `levelOf`, `rowOf`, `lip`, `chart`, `plainAt`; callers supply the complete record.
 */
export interface IAutoMovieHumanWebSurface {
  /** A row's level in the chart of a web's child. */
  levelOf: (
    r: number,
    own: IAutoMovieHumanWebChild,
    web: IAutoMovieHumanWeb,
  ) => number;

  /** The row at a level of the chart of a web's child: the inverse of `levelOf`. */
  rowOf: (
    x: number,
    own: IAutoMovieHumanWebChild,
    web: IAutoMovieHumanWeb,
  ) => number;

  /** A margin's lip at a depth past the ring, as a share of its radius. */
  lip: (
    web: IAutoMovieHumanWeb,
    side: number,
    share: number,
  ) => AutoMovieVector3Tuple;

  /** A column near a web at a row: the saddle's translational chart. */
  chart: (
    col: IAutoMovieHumanWebSurface.Plain,
    own: IAutoMovieHumanWebChild,
    r: number,
  ) => AutoMovieVector3Tuple;

  /** A column away from the webs: its point at a row, between the parent's and child's copied jets. */
  plainAt: (
    col: IAutoMovieHumanWebSurface.Plain,
  ) => (r: number) => AutoMovieVector3Tuple;
}

/** Type contracts exchanged by IAutoMovieHumanWebSurface; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanWebSurface {
  /** A column away from the pinches.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A column away from the pinches.
   * @evidence contracts/development/design.md#principled-representation A column away from the pinches. Extract< IAutoMovieHumanWebColumn, { kind: "plain"; } > retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanWebSurface.Plain belongs to IAutoMovieHumanWebSurface; its public declaration is reached by the Human main-entry export closure.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A column away from the pinches. Its exported identity is retained for the existing Human public surface.
   */
  export type Plain = Extract<
    IAutoMovieHumanWebColumn,
    {
      /** Discriminant selecting the plain representation. */
      kind: "plain";
    }
  >;
}
