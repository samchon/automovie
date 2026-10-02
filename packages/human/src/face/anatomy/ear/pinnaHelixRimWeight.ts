/**
 * Scale of the helix ridge along the pinna outline, zero across the lobule.
 *
 * The helix is the cartilage rim of the pinna; it ends at the lobule, which is
 * soft tissue without cartilage and so carries no rim. `along` is the
 * outline parameter in [0, 1) at which the helix is sampled and `points` the
 * number of control points the outline spans, so `along * points` is a
 * fractional control-point index. The first and last control points of the
 * lobule are `lobule.from` and `lobule.to` (indices, `from <= to`). The weight
 * is one before `from - 1`, falls to zero at `from` by a cubic smooth step,
 * stays zero through `to`, and rises to one at `to + 1`. A cubic smooth step
 * has zero slope at both ends, so the ridge meets its plateau without a
 * crease. Values outside the outline wrap are clamped, not extrapolated.
 *
 * @evidence contracts/common.md#principled-implementation The smooth step 3t^2-2t^3 is the lowest-order polynomial that goes from 0 to 1 with zero slope at both ends, so the fade is C1 with its plateaus; the window is expressed in outline index units, which is the units in which the outline's control points are placed.
 * @evidence contracts/common.md#clear-and-simple-design One pure function of three numbers; the outline and the ridge stay with the builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is special-cased; the window is a property of the outline's lobule indices.
 * @evidence contracts/common.md#meaningful-documentation The comment states the anatomical reason, the index units and the fade shape.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part; it scales one ridge of the pinna builder.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitives.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The inputs are dimensionless outline parameters and index counts; no unit or frame is involved.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part; the pinna builder that consumes it is observed.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on the outline's own indices, not an input through which a caller shapes a human form.
 */
export function pinnaHelixRimWeight(
  along: number,
  points: number,
  lobule: { from: number; to: number },
): number {
  const smooth = (t: number): number => {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  };
  const at = along * points;
  return 1 - smooth(at - (lobule.from - 1)) * (1 - smooth(at - lobule.to));
}
