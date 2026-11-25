import type { IAutoMovieViewConic } from "./IAutoMovieViewConic";

/** Data and callback contracts shared by the LoftPhaseSource operations. */
export namespace IAutoMovieLoftPhaseSource {
  /** Explicit native functions and their natural-coordinate cardinal jets. */
  export interface ISource {
    /**
     * Increasing coordinates q: station mm, signed sqrt(mm), or radians as
     * chosen by the caller.
     */
    coordinates: readonly number[];

    /**
     * Native sections in the same order, with millimetre radii and polar-radian
     * phase.
     */
    curves: readonly IAutoMovieViewConic.ICurve[];

    /** Cardinal first derivatives in q at every source coordinate. */
    slopes: readonly (readonly number[])[];

    /** Cardinal second derivatives in q at the same coordinates. */
    curvatures: readonly (readonly number[])[];
  }

  /** One station's explicit linear combinations of native source functions. */
  export interface IStation {
    /** Explicit immutable native source. */
    source: IAutoMovieLoftPhaseSource.ISource;

    /**
     * Value, first and second derivative weights, in q unless station supplied
     * a physical change of coordinate.
     */
    weights: readonly (readonly number[])[];
  }
}
