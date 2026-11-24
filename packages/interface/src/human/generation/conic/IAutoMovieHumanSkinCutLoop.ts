import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Read a signed surface along rays of a host's chart.
 */
export namespace IAutoMovieHumanSkinCutLoop {
  /**
   * An elliptical chart ray family and the first outward crossing it seeks.
   */
  export interface IInput {
    /** The host's world position in millimetres at a chart address. */
    point: (u: number, v: number) => AutoMovieVector3Tuple;

    /** The ray origin in the host chart, on the part's side of the surface. */
    centre: [number, number];

    /** Positive ellipse semiaxes, in each chart coordinate's units. */
    semi: [number, number];

    /** The second chart coordinate's sign as the clock advances. */
    sense: 1 | -1;

    /** Number of columns sampled at uniformly spaced clocks across one turn. */
    count: number;

    /** The surface field, negative on the part's side and zero at contact. */
    side: (point: AutoMovieVector3Tuple) => number;

    /** Largest dimensionless share of the ellipse's radius to search on each ray. */
    reach: number;
  }
}
