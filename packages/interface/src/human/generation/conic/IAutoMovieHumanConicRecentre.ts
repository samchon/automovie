import type { IAutoMovieHumanConicSection } from "./IAutoMovieHumanConicSection";

/**
 * Conic section origins and fields used to relocate sections within their
 * course planes.
 */
export namespace IAutoMovieHumanConicRecentre {
  /**
   * An origin line as its shift from the base course at each knot, in the
   * section chart, mm.
   */
  export interface ILine {
    /** The new origin's `u` at each knot, mm from the base course point. */
    u: readonly number[];

    /** The new origin's `v` at each knot, mm from the base course point. */
    v: readonly number[];
  }

  /** The section fields passed to an origin change. */
  export interface IFields {
    /** Shared station knots, mm. */
    knots: readonly number[];

    /** Knot values by section field then knot. */
    values: readonly (readonly number[])[];

    /** The anchors every section is read through. */
    layout: IAutoMovieHumanConicSection.ILayout;
  }
}
