import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/** Data and callback contracts shared by the TetrahedralizeDelaunay operations. */
export namespace IAutoMovieTetrahedralizeDelaunay {
  /**
   * The tetrahedra over the points, each by four indices in positive
   * orientation on the joggled points.
   */
  export interface IMesh {
    /** The tetrahedra. */
    tetrahedra: readonly (readonly [number, number, number, number])[];

    /**
     * The joggled points the mesh is Delaunay and positively oriented on, world
     * metres.
     */
    points: readonly IAutoMovieVector3[];
  }
}
