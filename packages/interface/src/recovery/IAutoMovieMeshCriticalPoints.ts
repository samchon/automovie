import type {
  AutoMovieVector3Tuple,
  IAutoMovieMeshCriticalVertex,
  IAutoMovieRecoveryIndexedMesh,
} from "..";

/**
 * Callable observation of critical source vertices along a physical scalar
 * chart.
 */

export namespace IAutoMovieMeshCriticalPoints {
  /**
   * Classify piecewise-linear lower and upper source links along the supplied
   * axis or aligned scalar heights. The default preserves legacy cycle
   * classification. The boundary policy also admits strict regular boundary
   * paths. Return observations ordered by scalar level and vertex.
   */

  export type Operation = (
    skin: IAutoMovieRecoveryIndexedMesh,
    axis?: AutoMovieVector3Tuple,
    scalarHeights?: readonly number[],
    policy?: "legacy-link-cycle-v1" | "boundary-regular-path-v1",
  ) => IAutoMovieMeshCriticalVertex[];
}
