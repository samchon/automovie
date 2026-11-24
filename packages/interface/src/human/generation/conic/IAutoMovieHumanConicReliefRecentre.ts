import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieLoftRelief } from "../../../construction/IAutoMovieLoftRelief";
import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";

/**
 * Public contracts for recentring a relief.
 */
export namespace IAutoMovieHumanConicReliefRecentre {
  /**
   * A wall without its reliefs, as a chart the conversion can read.
   */
  export interface ISkin {
    /** The course the wall is charted about: at a station, the chart's origin and its `u` and `v`. */
    axis: IAutoMovieViewAxis.IAxis;

    /** The bare wall's world point at a station, mm, and a phase, radians, of that chart. */
    point: (station: number, phase: number) => AutoMovieVector3Tuple;

    /** The open range of stations `point` is defined on, mm. */
    stations: [number, number];
  }

  /**
   * What a conversion reads.
   */
  export interface IProps {
    /** The stored wall, about the stored origin. */
    stored: ISkin;

    /** The wall the converted nets stand on, about the new origin, on the same section planes. */
    made: ISkin;

    /** The stored nets, in the order they are composed. */
    reliefs: readonly IAutoMovieLoftRelief[];

    /** Target samples per span of a net, each way; absent, 4. */
    samples?: number;

    /** Applied to a net's new window and directions before it is fitted: the place to round them to the precision they are stored at. */
    lay?: (net: IAutoMovieLoftRelief, stored: IAutoMovieLoftRelief) => IAutoMovieLoftRelief;

    /** Applied to a fitted net before the next net reads it: the place to round its heights to the precision they are stored at. */
    store?: (net: IAutoMovieLoftRelief, stored: IAutoMovieLoftRelief) => IAutoMovieLoftRelief;
  }

  /**
   * One converted net with how it was converted.
   */
  export interface INet {
    /** The converted net, on the made wall's chart. */
    relief: IAutoMovieLoftRelief;

    /** How its targets were read (the namespace's text). */
    mode: "carried" | "cast" | "skew";

    /** Sampled rows that gave targets, and those that gave none. */
    rows: { observed: number; unobserved: number; first: number; last: number };

    /** The targets less the fitted net at the fit's own samples, mm. */
    residual: { mean: number; max: number };
  }
}
