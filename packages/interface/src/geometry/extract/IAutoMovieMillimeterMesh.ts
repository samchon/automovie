/**
 * A triangle mesh in millimetres: flat xyz positions, three indices per
 * triangle.
 */
export interface IAutoMovieMillimeterMesh {
  /** Flat positions, three numbers per vertex, millimetres. */
  positions: ArrayLike<number>;

  /** Flat triangle indices, three per triangle. */
  indices: ArrayLike<number>;
}
