/**
 * Whether one point is solid or empty with respect to a triangle surface, as a
 * query from `createAutoMovieMeshWindingQuery` answers it.
 *
 * The answer reads the generalized winding number (Jacobson, Kavan and
 * Sorkine-Hornung 2013), so it stays meaningful on surfaces that are not closed
 * manifolds: an open tube, overlapping shells merged into one mesh, or a
 * repaired surface that keeps a small hole. The point and every distance behind
 * the answer are in the mesh's own frame, in metres.
 */
export interface IAutoMovieMeshWinding {
  /**
   * The generalized winding number: the signed solid angles of every triangle
   * seen from the point, summed and divided by 4 pi.
   *
   * It is 1 inside an outward closed shell, 0 outside it, -1 inside a shell
   * wound inward, and the count of shells where outward shells overlap. Near a
   * hole it falls between those values by the share of the view the hole takes.
   * It is not meaningful when `surface` is true, because solid angles have no
   * limit on the surface itself.
   */
  winding: number;

  /**
   * Whether the point lies on a triangle with positive area, its edges and
   * corners included, within a slack of 1e-9 of that triangle's doubled area.
   */
  surface: boolean;

  /**
   * Whether the point is solid: `surface` is false and the absolute winding
   * number is at least 0.5. The absolute value counts an inward-wound shell as
   * solid; `winding` keeps the sign for a caller that must see the reversal.
   */
  inside: boolean;
}
