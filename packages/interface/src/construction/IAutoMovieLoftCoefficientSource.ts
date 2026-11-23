import type { IAutoMovieConstructionOutlineParameter } from "./IAutoMovieConstructionOutlineParameter";
import type { IAutoMovieStationHermite } from "./IAutoMovieStationHermite";

/** Data and callback contracts shared by the LoftCoefficientSource operations. */
export namespace IAutoMovieLoftCoefficientSource {
  /**
   * A finite virtual endpoint in the chosen coordinate, not a physical-station
   * jet.
   */
  export interface IEnd extends IAutoMovieStationHermite.IEnd {
    /** Actual pole station, kernel mm. */
    station: number;

    /**
     * Finite first derivatives in the chosen parameter, rather than per-mm
     * station derivatives.
     */
    slope: readonly number[];

    /** Finite second derivatives in the chosen coordinate. */
    curvature: readonly number[];
  }

  /** Optional virtual coefficient endpoints for actual closing ends. */
  export interface IEnds {
    /** Virtual zero section of a bottom cap; absent at an open bottom. */
    bottom?: IAutoMovieLoftCoefficientSource.IEnd;

    /** Virtual zero section of a top cap; absent at an open top. */
    top?: IAutoMovieLoftCoefficientSource.IEnd;
  }

  /** Direct parameter-derivative data of one principal coefficient row. */
  export interface ISource {
    /** Admitted root/angle map with kernel-mm endpoints. */
    parameter: IAutoMovieConstructionOutlineParameter;

    /** First derivative of the layer's coefficients in that map. */
    slopes: readonly number[];

    /** Second derivative of the same coefficient row in that map. */
    curvatures: readonly number[];

    /** Shared finite virtual pole records. */
    ends: IAutoMovieLoftCoefficientSource.IEnds;
  }

  /**
   * One parameter span's direct endpoint arrays and three interpolation-weight
   * rows.
   */
  export interface IControls {
    /** Lower endpoint values and parameter derivatives. */
    a: IAutoMovieStationHermite.IEnd;

    /** Upper endpoint values and parameter derivatives. */
    b: IAutoMovieStationHermite.IEnd;

    /** Value/first/second parameter-coordinate Hermite weights. */
    weights: number[][];

    /**
     * Forward parameter derivatives in physical station, or null at a
     * singular/nonfinite 2-jet.
     */
    change: [number, number] | null;
  }
}
