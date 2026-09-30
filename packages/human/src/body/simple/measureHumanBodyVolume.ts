import { humanBodyCappedSurface } from "./humanBodyCappedSurface";

/**
 * The volume enclosed by a triangle surface, in cubic metres, with its open
 * boundary loops capped.
 *
 * The signed volume is the sum of the tetrahedra each triangle spans with
 * the origin, `a · (b × c) / 6`; on a closed, consistently wound surface the
 * sum is the enclosed volume up to sign. The body basis is not closed: the
 * face was cut away at the neck, leaving one boundary loop. Every boundary
 * loop is fanned to its own vertex centroid with the winding its triangles
 * imply. This closes each opening independently, including a top and bottom
 * opening on one surface.
 *
 * @evidence contracts/common.md#principled-implementation The tetrahedron sum over a surface closed by centroid fans is the enclosed volume up to sign, and the absolute value removes the sign of the winding; the method is that of `humanBodyCappedSurface`, which owns the premises.
 * @evidence contracts/common.md#clear-and-simple-design A one-line adapter over the capped surface, which owns the closing; it adds no layer of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is special-cased; the volume depends on the positions and indices alone.
 * @evidence contracts/common.md#meaningful-documentation The comment states the unit, the sum, and how open loops are closed.
 * @evidence contracts/modeling.md#spatial-conventions Positions in metres give cubic metres; no conversion occurs.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry the viewer displays; the cap fan is an internal measuring surface of one triangle per boundary edge.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is not an input through which a caller shapes a body.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and does not check the cap; the checked volume is `humanBodySimpleVolume`.
 */
export function measureHumanBodyVolume(
  positions: number[],
  indices: number[],
): number {
  return humanBodyCappedSurface(positions, indices).volume;
}
