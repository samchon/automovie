import type { AutoMovieVector2Tuple } from "../../../geometry/AutoMovieVector2Tuple";

/**
 * Public contracts for a conic groove.
 */
export namespace IAutoMovieHumanGrooveFade {
  /**
   * A median groove at its full form.
   */
  export interface IGroove {
    /** The crest's distance from the median line, mm: the groove's half width. */
    half: number;

    /** How far the floor lies inside the line through the two crests, mm. */
    depth: number;

    /** The inflection's tangent's turn inward from the crest's, radians, in (0, pi / 2). */
    turn: number;
  }

  /**
   * A groove's three anchors of one side in the section's chart.
   */
  export interface IAnchors {
    /** The crest. */
    crest: AutoMovieVector2Tuple;

    /** The inflection, halfway down and halfway across the flank. */
    inflection: AutoMovieVector2Tuple;

    /** The inflection's tangent's heading in the chart, radians. */
    heading: number;

    /** The floor, on the median line. */
    floor: AutoMovieVector2Tuple;
  }
}
