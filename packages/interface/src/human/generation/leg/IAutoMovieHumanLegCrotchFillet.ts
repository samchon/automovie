import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanLegCrotchFillet; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanLegCrotchFillet {
  /** The leg's start ring at the leg's phases. */
  export interface ILoop {
    /** Points of the loop at the leg's phases. */
    points: AutoMovieVector3Tuple[];

    /** Outward horizontal normals there. */
    normals: AutoMovieVector3Tuple[];

    /** The trunk's station derivative at each point, per mm up. */
    rates: AutoMovieVector3Tuple[];

    /** The trunk's second station derivative at each point, per mm squared. */
    seconds: AutoMovieVector3Tuple[];

    /** Distance along the trunk's arc to the nearer pinch; 0 off the arc. */
    edges: number[];
  }
}
