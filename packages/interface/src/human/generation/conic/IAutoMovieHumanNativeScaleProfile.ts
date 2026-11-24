import type { AutoMovieVector2Tuple } from "../../../geometry/AutoMovieVector2Tuple";

/**
 * Directional scales, held centres and their material derivatives.
 */
export namespace IAutoMovieHumanNativeScaleProfile {
  /**
   * A two-component section value and its first two material station derivatives.
   */
  export interface IJet {
    /** Depth and breadth ratios for a scale, or section coordinates in mm for a centre. */
    value: AutoMovieVector2Tuple;

    /** First material station derivatives, in value units per mm. */
    first: AutoMovieVector2Tuple;

    /** Second material station derivatives, in value units per mm squared. */
    second: AutoMovieVector2Tuple;
  }

  /**
   * A scale that is called like a plain `(station) => [a, b]` and also carries its jet.
   */
  export interface IScale {
    /** Depth and breadth ratios at a material station, mm. */
    (station: number): AutoMovieVector2Tuple;

    /** The ratios and their first two station derivatives at a material station, mm. */
    jet: (station: number) => IJet;

    /** Increasing material stations, mm, where the law changes piece; its value and first two derivatives are continuous there. */
    breaks: readonly number[];

    /** The ratio every station reads, when the law is constant by construction; otherwise null. */
    constant: AutoMovieVector2Tuple | null;
  }

  /**
   * A scaling centre line: where the tissue scale's fixed point stands in each section's chart, as a station function with its 2-jet.
   *
   * A native source scales each chart coordinate about this point, c(s) + a(s)·(f(s) - c(s)), so the line itself stays where it is. The
   * consumer chooses the line (a skeletal datum, the course itself); this type only carries it.
   */
  export interface ICentre {
    /** The centre's chart coordinates [u, v], mm from the course point, and their first two station derivatives. */
    jet: (station: number) => IJet;

    /** Increasing material stations, mm, where the line changes piece; its value and first two derivatives are continuous there. */
    breaks: readonly number[];
  }
}
