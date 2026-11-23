/**
 * Where one subdivided vertex sits on its cage face, so a caller can address a
 * surface point by cage face and local coordinates instead of by output index.
 *
 * A quad cage face has one parameter square: `(0, 0)` at its corner 0, `(1, 0)`
 * at corner 1, `(1, 1)` at corner 2 and `(0, 1)` at corner 3, and `corner` is
 * `null`. Any other polygon is split, as in Ptex and OpenSubdiv, into one quad
 * per corner `k`, with `(0, 0)` at corner `k`, `(1, 0)` at the midpoint of the
 * edge to corner `k + 1`, `(1, 1)` at the face centre and `(0, 1)` at the
 * midpoint of the edge from corner `k - 1`. A vertex shared by several cage
 * faces, or by several sub-faces of one, is reported on the lowest-numbered
 * face and then the lowest-numbered corner.
 */
export interface IAutoMovieSubdivisionParameter {
  /** Index of the cage face in `IAutoMovieSubdivisionCage.faces`. */
  face: number;

  /**
   * Corner whose sub-face holds the vertex when the cage face is not a quad;
   * `null` for a quad cage face.
   */
  corner: number | null;

  /** First local coordinate, from 0 to 1. */
  u: number;

  /** Second local coordinate, from 0 to 1. */
  v: number;
}
