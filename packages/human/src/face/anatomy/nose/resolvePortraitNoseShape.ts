import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";

/**
 * Admit one nose shape and return an owned copy.
 *
 * Every field is a named nasal measurement or scale (millimetres, degrees or a
 * dimensionless ratio), so admission is a statement about numbers only: each
 * dimension must be finite; the width, aperture and depth scales, the cavity
 * contraction and the rim support must be positive; the contraction and the
 * support are strictly below one, which keeps the lining contracted inside the
 * rim and the support ring strictly between rim and floor; the roundness is
 * within [0, 1]; the blend reach is nonnegative; and the cavity offset is three
 * finite numbers. Nothing is mutated, and the caller's arrays are not aliased.
 *
 * These checks say the shape is constructible, not that it is a living nose:
 * the bounds of a living nose are not encoded here.
 *
 * @evidence contracts/common.md#principled-implementation Admission is a set of closed-form predicates over the shape: finiteness, the open intervals that keep the lining contracted inside the rim and the support ring between rim and floor, and structural copying so later caller edits cannot change a built nose.
 * @evidence contracts/common.md#clear-and-simple-design The dimension rules live in one function beside the component that reads them; the component keeps only fitting and attachment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is special-cased; every refusal is a statement about the shape alone.
 * @evidence contracts/common.md#meaningful-documentation The comment lists each refusal class, the ownership of the copy and the limit of what admission means.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part; it admits the shape of the nose component.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitives.
 * @evidence contracts/modeling.md#spatial-conventions The copied shape retains head millimetres for displacements, degrees for tilt and dimensionless ratios for scales, as defined by IPortraitNoseShape; admission converts none of these quantities.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part; the component observes the assembled nose.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function admits inputs defined on IPortraitNoseShape and adds none.
 */
export function resolvePortraitNoseShape(
  input: IPortraitNoseShape,
): IPortraitNoseShape & { cavityOffset: number[] } {
  const shape = { ...input, cavityOffset: [...input.cavityOffset] };
  if (
    [
      shape.widthScale,
      shape.depthScale ?? 1,
      shape.nostrilWidthScale,
      shape.nostrilHeightScale,
      shape.cavityContraction,
      shape.rimSupport,
    ].some((v) => !Number.isFinite(v) || v <= 0) ||
    shape.cavityContraction >= 1 ||
    shape.rimSupport >= 1 ||
    !Number.isFinite(shape.rimRoundness) ||
    shape.rimRoundness < 0 ||
    shape.rimRoundness > 1 ||
    !Number.isFinite(shape.blendReach) ||
    shape.blendReach < 0 ||
    ![
      shape.tipProjection,
      shape.alarProjection,
      shape.nostrilRise,
      shape.nostrilTilt,
    ].every(Number.isFinite) ||
    shape.cavityOffset.length !== 3 ||
    !shape.cavityOffset.every(Number.isFinite)
  )
    throw new Error(
      "Nasal dimensions must be finite, with positive scales, a contracted inner lining and a supported rim.",
    );
  return shape;
}
