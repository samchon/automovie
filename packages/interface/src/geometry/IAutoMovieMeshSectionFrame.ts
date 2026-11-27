import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/** An orthonormal frame: origin and three unit axes. */
export interface IAutoMovieMeshSectionFrame {
  /** Section-frame origin in the input mesh's coordinate frame, millimetres. */
  origin: AutoMovieVector3Tuple;

  /**
   * Three orthonormal unit directions expressed in the mesh frame; outline
   * assumes rather than validates orthonormality.
   */
  axes: [AutoMovieVector3Tuple, AutoMovieVector3Tuple, AutoMovieVector3Tuple];
}
