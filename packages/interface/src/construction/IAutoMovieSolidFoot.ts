import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** Data and callback contracts shared by the SolidFoot operations. */
export namespace IAutoMovieSolidFoot {
  /**
   * A locally accepted stationary foot and its world separation from the
   * target.
   */
  export interface IFoot {
    /** Chart parameters. */
    u: number;

    /** Chart parameters. */
    v: number;

    /** The surface point there, mm. */
    point: AutoMovieVector3Tuple;

    /** Distance from the world point, mm. */
    distance: number;
  }
}
