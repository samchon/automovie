import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Floor-aligned foot frames, shared host stations and dimensionless transverse
 * supports. Runtime construction and admission remain with
 * AutoMovieHumanFootHost in Human.
 */
export namespace IAutoMovieHumanFootHost {
  /** A foot's frame on the floor. */
  export interface IFrame {
    /** The heel's rearmost point on the floor. */
    heel: AutoMovieVector3Tuple;

    /** The unit direction from the heel to the toes. */
    along: AutoMovieVector3Tuple;

    /** The unit lateral direction on the floor. */
    lateral: AutoMovieVector3Tuple;

    /** The ankle's place ahead of the heel, mm. */
    back: number;
  }

  /**
   * The exact stations and cap used by both source normalization and the actual
   * foot builder.
   */
  export interface IPlan {
    /** Named sites and table rows, strictly rising shares. */

    named: [string, number][];

    /** Hidden forefoot cap share. */

    end: number;

    /** Public first-ball skin station share. */

    first: number;

    /** Fifth-ball station share, a retained cascade transfer convention. */

    fifth: number;
  }

  /**
   * Retained host's independent dimensionless regional supports, not the
   * group's public breadth or one cut's radii.
   */
  export interface ITransverse {
    /** Largest retained lateral support, before the common group scale. */

    lateral: number;

    /** Largest retained medial support, before the common group scale. */

    medial: number;
  }
}
