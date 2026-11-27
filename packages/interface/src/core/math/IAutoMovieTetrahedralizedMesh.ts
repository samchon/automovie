import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/** Tetrahedra over the input points, positively oriented after joggling. */
export interface IAutoMovieTetrahedralizedMesh {
  /** Each tetrahedron by four point indices in positive orientation. */
  tetrahedra: readonly (readonly [number, number, number, number])[];

  /** Joggled points the mesh is Delaunay and positively oriented on, in metres. */
  points: readonly IAutoMovieVector3[];
}