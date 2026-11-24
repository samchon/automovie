import type { IAutoMovieSolidSurface } from "../../../construction/IAutoMovieSolidSurface";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * A signed surface field prepared from landmarks in the figure frame.
 */
export namespace IAutoMovieHumanLandmarkSurface {
  /**
   * The prepared plane and the signed distance along its normal.
   */
  export interface ISurface {
    /** The original centre projected onto the base plane, in figure millimetres. */
    origin: AutoMovieVector3Tuple;

    /** The base plane's unit normal, oriented toward the far side. */
    normal: AutoMovieVector3Tuple;

    /** Project a figure point onto the base plane, returning its radial distance in mm and its authored phase in radians. */
    address: (point: readonly number[]) => [number, number];

    /** The exact surface 2-jet in the original polar chart at a strictly positive radius. Its parameter cross product faces against normal. */
    jet: (radius: number, phase: number) => IAutoMovieSolidSurface.IJet;

    /** Signed distance along the normal in millimetres, positive on the far side of the surface. */
    side: (point: readonly number[]) => number;
  }
}
