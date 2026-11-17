import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanBodySurfaceNormals; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanBodySurfaceNormals {
  /** A chain's sections at a station and its two difference neighbours.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A chain's sections at a station and its two difference neighbours.
   * @evidence contracts/development/design.md#principled-representation `here`: Actual world value/phase tangent plan, independent of physical station2. `lo`: The station STEP mm below, clamped into the chain. `hi`: The station STEP mm above, clamped into the chain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodySurfaceNormals.stationJet. Also types AutoMovieHumanBodySurfaceNormals.cache, AutoMovieHumanBodySurfaceNormals.stations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `here`, `lo`, `hi`; callers supply the complete record.
   */
  export interface IStationJet {
    /** Actual world value/phase tangent plan, independent of physical station2. */
    here: (phaseRadians: number) => {
      /** Sampled position in the curve's source frame, millimetres. */
      p: AutoMovieVector3Tuple;
      /** First derivative of the world position with respect to section phase, millimetres per radian; it is not normalized. */
      t: AutoMovieVector3Tuple;
    };

    /** The station STEP mm below, clamped into the chain. */
    lo: IStationSample;

    /** The station STEP mm above, clamped into the chain. */
    hi: IStationSample;
  }

  /** Caller-owned actual world value plan of one station.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Caller-owned actual world value plan of one station.
   * @evidence contracts/development/design.md#principled-representation `at`: Actual world point reader retained by this normal calculation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanBodySurfaceNormals.place. Also types AutoMovieHumanBodySurfaceNormals.sample.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`; callers supply the complete record.
   */
  export interface IStationSample {
    /** Actual world point reader retained by this normal calculation. */
    at: (phaseRadians: number) => AutoMovieVector3Tuple;
  }
}
