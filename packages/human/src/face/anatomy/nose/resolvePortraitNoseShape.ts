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
