import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * World-point and phase-tangent readers for a station and its physical
 * difference neighbours.
 *
 * The interface package owns these declarations;
 * AutoMovieHumanBodySurfaceNormals in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanBodySurfaceNormals {
  /** A chain's sections at a station and its two difference neighbours. */
  export interface IStationJet {
    /** Actual world value/phase tangent plan, independent of physical station2. */
    here: (phaseRadians: number) => {
      /** Sampled position in the curve's source frame, millimetres. */
      p: AutoMovieVector3Tuple;
      /**
       * First derivative of the world position with respect to section phase,
       * millimetres per radian; it is not normalized.
       */
      t: AutoMovieVector3Tuple;
    };

    /** The station STEP mm below, clamped into the chain. */
    lo: IStationSample;

    /** The station STEP mm above, clamped into the chain. */
    hi: IStationSample;
  }

  /** Caller-owned actual world value plan of one station. */
  export interface IStationSample {
    /** Actual world point reader retained by this normal calculation. */
    at: (phaseRadians: number) => AutoMovieVector3Tuple;
  }
}
