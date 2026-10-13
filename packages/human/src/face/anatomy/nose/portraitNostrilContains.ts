/**
 * Decide whether a point lies strictly inside an axis-aligned elliptical footprint, so a caller can select the host triangles that a nasal opening cuts from a measured skin mesh.
 *
 * The point and the footprint share one plane and one length unit (head millimetres in the nose socket). `x` and `y` of the footprint are the ellipse centre; `width` and `height` are its semi-axes and must be positive, because a zero semi-axis divides by zero and answers false or NaN silently. The boundary itself is outside (strict inequality), so a triangle centroid exactly on the ellipse is not cut. The function only classifies: the boundary walker `orderCutPatchBoundary` turns the selected triangles into the ordered cyclic opening that the nose component fits.
 *
 * @evidence contracts/common.md#principled-implementation A strict normalized elliptical footprint classifies a planar point.
 * @evidence contracts/common.md#clear-and-simple-design This standalone exported classifier currently has no direct repository execution caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive finite semi-axes and shared units are caller premises; this helper does not admit malformed direct inputs or infer a cavity.
 * @evidence contracts/common.md#meaningful-documentation The exact boundary is outside and head-millimetre source uses require matching point/footprint units.
 * @evidence contracts/performance.md#efficient-algorithms Two normalized squared terms take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work No sampling result is memoized or duplicate boundary-fitting logic introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and the borrowed footprint is not retained.
 */
export const portraitNostrilContains: (x: number, y: number, footprint: { x: number; y: number; width: number; height: number; }) => boolean = (
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
