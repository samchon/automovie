/**
 * Decide whether a point lies strictly inside an axis-aligned elliptical
 * footprint, so a caller can select the host triangles that a nasal opening
 * cuts from a measured skin mesh.
 *
 * The point and the footprint share one plane and one length unit (head
 * millimetres in the nose socket). `x` and `y` of the footprint are the
 * ellipse centre; `width` and `height` are its semi-axes and must be positive,
 * because a zero semi-axis divides by zero and answers false or NaN silently.
 * The boundary itself is outside (strict inequality), so a triangle centroid
 * exactly on the ellipse is not cut. The function only classifies: the
 * boundary walker `orderCutPatchBoundary` turns the selected triangles into
 * the ordered cyclic opening that the nose component fits.
 *
 */
export const portraitNostrilContains = (
  x: number,
  y: number,
  footprint: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
): boolean =>
  ((x - footprint.x) / footprint.width) ** 2 +
    ((y - footprint.y) / footprint.height) ** 2 <
  1;
