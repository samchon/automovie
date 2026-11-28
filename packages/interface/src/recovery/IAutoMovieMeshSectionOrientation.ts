import type {
  IAutoMovieMeshPlaneContour,
  IAutoMoviePlaneFrame,
  IAutoMovieRecoveryIndexedMesh,
} from "..";

/** Callable material-side witness for a closed observed cut. */

export namespace IAutoMovieMeshSectionOrientation {
  /**
   * Prepare source edge-to-face incidence and a material orientation sign.
   * Supply a sign explicitly or infer it from nonzero signed source volume. The
   * returned callable compares a closed cut's observed segment and its
   * supporting face in the plane.
   */

  export type Operation = (
    skin: IAutoMovieRecoveryIndexedMesh,
    orientation?: "signed-volume" | 1 | -1,
  ) => (
    plane: IAutoMoviePlaneFrame,
    polyline: IAutoMovieMeshPlaneContour,
  ) => number;
}
