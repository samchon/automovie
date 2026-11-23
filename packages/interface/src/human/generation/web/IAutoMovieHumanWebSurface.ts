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
  /**
   * Dimensionless chart level at row r: -1 at the parent's ring, 0 at the crest and own.depth / web.rho at the child's section. r uses the row count supplied to AutoMovieHumanWebSurface.of and may be fractional.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A row's level in the chart of a web's child.
   */
  levelOf: (
    r: number,
    own: IAutoMovieHumanWebChild,
    web: IAutoMovieHumanWeb,
  ) => number;

  /**
   * Fractional row at dimensionless chart level x, inverse to levelOf on the parent's-ring-to-child interval. Levels below -1 saturate to the ring's row; callers supply the same child and web used for levelOf.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The row at a level of the chart of a web's child: the inverse of `levelOf`.
   */
  rowOf: (
    x: number,
    own: IAutoMovieHumanWebChild,
    web: IAutoMovieHumanWeb,
  ) => number;

  /**
   * Registered-frame margin point in millimetres. share is signed depth past the ring divided by the margin radius, clamped to [-1, 1]; side selects the signed margin direction, normally -1 or 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A margin's lip at a depth past the ring, as a share of its radius.
   */
  lip: (
    web: IAutoMovieHumanWeb,
    side: number,
    share: number,
  ) => AutoMovieVector3Tuple;

  /**
   * Registered-frame point in millimetres on a column near a web, at fractional row r in the configured row count. Column and child geometry must stay unchanged while this surface retains their endpoint calculations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A column near a web at a row: the saddle's translational chart.
   */
  chart: (
    col: IAutoMovieHumanWebSurface.Plain,
    own: IAutoMovieHumanWebChild,
    r: number,
  ) => AutoMovieVector3Tuple;

  /**
   * Prepare a reader for a column away from the webs. Its fractional row argument uses the configured row count and returns registered-frame millimetres between the parent's and child's copied jets. The prepared reader owns that fixed column's sampled curve.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A column away from the webs: its point at a row, between the parent's and child's copied jets.
   */
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
