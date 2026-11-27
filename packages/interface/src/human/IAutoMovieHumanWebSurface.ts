import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";
import type { IAutoMovieHumanWebChild } from "./IAutoMovieHumanWebChild";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";

/**
 * The third stage of a web's build: the surface's laws, the points a row of a
 * column takes.
 */
export interface IAutoMovieHumanWebSurface {
  /**
   * Dimensionless chart level at row r: -1 at the parent's ring, 0 at the crest
   * and own.depth / web.rho at the child's section. r uses the row count
   * supplied to AutoMovieHumanWebSurface.of and may be fractional.
   */
  levelOf: (
    r: number,
    own: IAutoMovieHumanWebChild,
    web: IAutoMovieHumanWeb,
  ) => number;

  /**
   * Fractional row at dimensionless chart level x, inverse to levelOf on the
   * parent's-ring-to-child interval. Levels below -1 saturate to the ring's
   * row; callers supply the same child and web used for levelOf.
   */
  rowOf: (
    x: number,
    own: IAutoMovieHumanWebChild,
    web: IAutoMovieHumanWeb,
  ) => number;

  /**
   * Registered-frame margin point in millimetres. share is signed depth past
   * the ring divided by the margin radius, clamped to [-1, 1]; side selects the
   * signed margin direction, normally -1 or 1.
   */
  lip: (
    web: IAutoMovieHumanWeb,
    side: number,
    share: number,
  ) => AutoMovieVector3Tuple;

  /**
   * Registered-frame point in millimetres on a column near a web, at fractional
   * row r in the configured row count. Column and child geometry must stay
   * unchanged while this surface retains their endpoint calculations.
   */
  chart: (
    col: IAutoMovieHumanWebSurface.Plain,
    own: IAutoMovieHumanWebChild,
    r: number,
  ) => AutoMovieVector3Tuple;

  /**
   * Prepare a reader for a column away from the webs. Its fractional row
   * argument uses the configured row count and returns registered-frame
   * millimetres between the parent's and child's copied jets. The prepared
   * reader owns that fixed column's sampled curve.
   */
  plainAt: (
    col: IAutoMovieHumanWebSurface.Plain,
  ) => (r: number) => AutoMovieVector3Tuple;
}

/**
 * Type contracts exchanged by IAutoMovieHumanWebSurface; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanWebSurface {
  /** A column away from the pinches. */
  export type Plain = Extract<
    IAutoMovieHumanWebColumn,
    {
      /** Discriminant selecting the plain representation. */
      kind: "plain";
    }
  >;
}
