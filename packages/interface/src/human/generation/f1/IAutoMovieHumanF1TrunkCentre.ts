import type { IAutoMovieHumanConicRecentre } from "../conic/IAutoMovieHumanConicRecentre";
import type { IAutoMovieHumanConicSection } from "../conic/IAutoMovieHumanConicSection";
import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";

/**
 * Public contracts for a recentered trunk course.
 */
export namespace IAutoMovieHumanF1TrunkCentre {
  /**
   * A family re-expressed about a centre line.
   */
  export interface IRecentred {
    /** The origin line's shift from the base course at each knot, in the section chart, mm. */
    line: IAutoMovieHumanConicRecentre.ILine;

    /** The family's own station knots, mm. */
    knots: readonly number[];

    /** The family's own layout. */
    layout: IAutoMovieHumanConicSection.ILayout;

    /** Knot values by section field then knot, about the origin line. */
    values: number[][];

    /** The base course with its origin on the line, every section plane and chart direction kept. */
    axis: IAutoMovieViewAxis.IAxis;
  }
}
