import type {
  IAutoMovieMeshPlaneContour,
  IAutoMoviePlaneFrame,
  IAutoMovieRecoveryIndexedMesh,
} from "..";

/**
 * Builds a private supporting-face orientation witness; its result
 * distinguishes outer from cavity contours. An explicit registered sign
 * bypasses global-volume inference and retains the supplied material-side
 * convention for open or independently oriented source shells.
 */

export namespace IAutoMovieMeshSectionOrientation {
  /**
   * Builds a private supporting-face orientation witness; its result
   * distinguishes outer from cavity contours. An explicit registered sign
   * bypasses global-volume inference and retains the supplied material-side
   * convention for open or independently oriented source shells.
   */

  export type Operation = (
    skin: IAutoMovieRecoveryIndexedMesh,
    orientation?: "signed-volume" | 1 | -1,
  ) => (
    plane: IAutoMoviePlaneFrame,
    polyline: IAutoMovieMeshPlaneContour,
  ) => number;
}
