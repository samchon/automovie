/**
 * Controls pair retention and transverse witness admission for the triangle
 * crossing query.
 */
export interface IAutoMovieMeshCrossingOptions {
  /**
   * True retains each admitted crossing pair. Omission keeps one witness per
   * first triangle and prefers a transverse witness over a coplanar one.
   */
  allPairs?: boolean;

  /**
   * Finite dimensionless margin in [0, 0.5) applied to segment and triangle
   * interior coordinates. Omission uses zero.
   */
  interiorTolerance?: number;

  /**
   * Optional classifier for each admitted transverse intersection point in the
   * common metre frame. Its two ordinals address the original first and second
   * meshes.
   *
   * Returning false rejects only this witness and continues the search. Leave
   * the mesh buffers unchanged during the call. Coplanar overlap follows its
   * own predicate.
   */
  acceptTransversePoint?: (
    point: readonly number[],
    triangle: number,
    other: number,
  ) => boolean;
}
