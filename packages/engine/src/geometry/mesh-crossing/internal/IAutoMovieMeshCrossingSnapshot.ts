import type { IAutoMovieMeshQueryHierarchy } from "@automovie/interface";

import type { IAutoMovieMeshCrossingTriangle } from "./IAutoMovieMeshCrossingTriangle";

/*
 * Copied source addressing and current target geometry for one crossing query.
 */
export interface IAutoMovieMeshCrossingSnapshot {
  /*
   * Fixed XYZ scalar count, including positions outside the index run.
   */
  readonly positionCount: number;

  /*
   * Copied source index run whose original triples determine ordinals.
   */
  readonly indices: readonly number[];

  /*
   * Current copied triangles in original order, including degenerate triangles.
   */
  readonly triangles: readonly IAutoMovieMeshCrossingTriangle[];

  /*
   * Current exact enclosing tree, absent for an empty index run.
   */
  readonly hierarchy:
    | IAutoMovieMeshQueryHierarchy<IAutoMovieMeshCrossingTriangle>
    | undefined;
}
