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
 *
 * @evidence contracts/development/design.md#principled-representation Each refinement step halves the parameter square, so a vertex's coordinates are the dyadic midpoints and centres of its ancestors, exact in binary64 for every practical level; the per-corner split of non-quads is the Ptex sub-face convention.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record per output vertex with the face, an optional sub-face corner and two coordinates, the smallest address that names any point of any polygon's surface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shared vertices take the lowest face and sub-face deterministically rather than one chosen per caller.
 * @evidence contracts/development/common.md#meaningful-documentation States both coordinate conventions, the meaning of a null corner, and which face and sub-face a shared vertex reports.
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
