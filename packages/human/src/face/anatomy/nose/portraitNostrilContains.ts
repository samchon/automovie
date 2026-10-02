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
 *
 * @evidence contracts/common.md#principled-implementation The ellipse implicit equation ((x-cx)/a)^2+((y-cy)/b)^2<1 is the exact interior test of an axis-aligned ellipse; its premises are a shared plane and unit and positive semi-axes, which the doc states. No tolerance is needed because callers classify triangle centroids and the strict boundary is documented.
 * @evidence contracts/common.md#clear-and-simple-design One predicate with the caller-owned footprint as its only input; the triangle selection and boundary ordering live elsewhere.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject, fixture or expected answer is special-cased: the result is a pure function of the point and the footprint.
 * @evidence contracts/common.md#meaningful-documentation The comment states the shared unit and plane, the semi-axis meaning, the strict boundary and who orders the selected opening.
 * @evidence contracts/modeling.md#spatial-conventions Point and footprint share one plane and one unit (head millimetres in the nose socket); no conversion happens here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nasal socket owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitives; it returns one value per call.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is not an input through which a caller shapes a human form; it is arithmetic on values the owner already named.
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
