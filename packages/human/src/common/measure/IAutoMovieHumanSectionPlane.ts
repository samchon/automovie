import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A cutting plane for one body section measurement.
 *
 * The plane passes through `point` with normal `normal`. A vertex whose
 * signed distance is zero counts as the positive side. An edge from an
 * on-plane vertex to a negative-side vertex therefore crosses at that endpoint.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSectionPlane {
  /** A point the plane passes through, in metres. */
  point: IAutoMovieVector3;

  /** Plane normal; its positive side includes on-plane vertices. */
  normal: IAutoMovieVector3;
}
