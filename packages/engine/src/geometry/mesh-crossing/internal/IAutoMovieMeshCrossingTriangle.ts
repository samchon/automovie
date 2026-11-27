import type { IAutoMovieSpatialQueryEntry } from "@automovie/interface";

/*
 * One original triangle, including degenerate triangles, in one snapshot.
 */
export interface IAutoMovieMeshCrossingTriangle extends IAutoMovieSpatialQueryEntry {
  /*
   * Three copied XYZ corners in the snapshot's common metre frame.
   */
  readonly corners: number[][];
}
