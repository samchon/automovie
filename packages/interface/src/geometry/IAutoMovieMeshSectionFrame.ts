import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Origin and three orthonormal directions expressed in the mesh frame. The
 * section calculation assumes these directions are unit and orthogonal.
 */
export interface IAutoMovieMeshSectionFrame {
  /**
   * Section reference point in the input millimetre frame. The centre of each
   * cut adds its station displacement along the selected direction.
   */
  origin: AutoMovieVector3Tuple;

  /**
   * Ordered orthonormal unit directions. An axis ordinal selects its normal and
   * the next two cyclic positions select chart axes.
   */
  axes: [AutoMovieVector3Tuple, AutoMovieVector3Tuple, AutoMovieVector3Tuple];
}
