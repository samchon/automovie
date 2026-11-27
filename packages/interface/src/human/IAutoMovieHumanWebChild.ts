import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";

/**
 * A web's column down one child: from the crest to the child's section along
 * the web's own separatrix.
 */
export interface IAutoMovieHumanWebChild {
  /** Phase where it meets the child's section. */
  phi: number;

  /** The point where it meets the child's section, mm. */
  q: AutoMovieVector3Tuple;

  /** The child's inward direction there. */
  d: AutoMovieVector3Tuple;

  /** Unit from the crest toward the child, across the web, along its own column. */
  eta: AutoMovieVector3Tuple;

  /**
   * Unit along the margin from the first pinch toward the second, square to
   * `eta`.
   */
  xi: AutoMovieVector3Tuple;

  /** Depth of its arrival past the crest, mm. */
  depth: number;

  /** Its point at a depth past the crest, mm. */
  own: (depth: number) => AutoMovieVector3Tuple;

  /** Its vertices from the crest to the section. */
  rows: number[];

  /** The column law beside the web on each side the child has there. */
  beside: IAutoMovieHumanWebChild.IBeside[];
}

/**
 * Type contracts exchanged by IAutoMovieHumanWebChild; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanWebChild {
  /** The column law beside a web on one side of the child. */
  export interface IBeside {
    /** Which side of the web, -1 at the first pinch's side. */
    side: number;

    /** The plain column at a chart distance from the pinch, margin radii. */
    law: (y: number) => Plain;

    /**
     * The greatest chart distance the law serves before the next web's columns,
     * margin radii.
     */
    reach: number;
  }

  /** A column away from the pinches. */
  export type Plain = Extract<
    IAutoMovieHumanWebColumn,
    {
      /** Discriminant selecting the plain representation. */
      kind: "plain";
    }
  >;
}
