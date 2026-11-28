import type { IAutoMovieMeasureFeatureEdges } from "./IAutoMovieMeasureFeatureEdges";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Input and output for the CPU reference of a worn material's per-fragment
 * feature-edge distances.
 */
export namespace IAutoMovieFeatureEdgeDistance {
  /**
   * A query point on one source triangle with the feature edge lists measured
   * in the same object-space metre frame.
   */
  export interface IProps {
    /**
     * Borrowed feature edge receipt for the mesh carrying the queried triangle.
     * It supplies the stored reach and referenced endpoints.
     */
    edges: IAutoMovieMeasureFeatureEdges.IResult;

    /**
     * Zero-based source triangle ordinal in the measured list array. An ordinal
     * without a list throws.
     */
    triangle: number;

    /**
     * Finite point on the selected triangle in object-space metres. For a
     * skinned mesh, use the measured bind pose coordinates.
     */
    point: IAutoMovieVector3;
  }

  /**
   * Capped distances to the nearest listed convex and concave segments in
   * object-space metres.
   *
   * A triangle's proximity list can be truncated to sixteen candidates. Treat
   * these values as distances to the listed segments.
   */
  export interface IResult {
    /**
     * Smallest listed distance to a convex segment, capped at measured reach. A
     * list with no nearer convex segment yields reach.
     */
    convex: number;

    /**
     * Smallest listed distance to a concave segment, capped at measured reach.
     * A list with no nearer concave segment yields reach.
     */
    concave: number;
  }
}
