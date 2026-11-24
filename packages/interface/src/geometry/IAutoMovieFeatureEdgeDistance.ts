import type { IAutoMovieMeasureFeatureEdges } from "./IAutoMovieMeasureFeatureEdges";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Input and result of `autoMovieFeatureEdgeDistance`, the CPU reference of the
 * per-fragment distances a worn material's shader computes.
 */
export namespace IAutoMovieFeatureEdgeDistance {
  /** A point on one triangle of a measured mesh. */
  export interface IProps {
    /** The mesh's measured feature edges. */
    edges: IAutoMovieMeasureFeatureEdges.IResult;

    /** Index of the input triangle the point lies on. */
    triangle: number;

    /** The point in the mesh's object space, metres. */
    point: IAutoMovieVector3;
  }

  /**
   * Distances from the point to the nearest listed segment of each sign, capped
   * at `reach`.
   */
  export interface IResult {
    /**
     * Metres to the nearest convex segment in the triangle's list, at most
     * `reach`; `reach` when none is nearer.
     */
    convex: number;

    /**
     * Metres to the nearest concave segment in the triangle's list, at most
     * `reach`; `reach` when none is nearer.
     */
    concave: number;
  }
}
