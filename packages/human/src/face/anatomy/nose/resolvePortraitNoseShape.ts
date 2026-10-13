import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";

/**
 * Admit one nose shape and return an owned copy.
 *
 * Every field is a named nasal measurement or scale (millimetres, degrees or a dimensionless ratio), so admission is a statement about numbers only: each dimension must be finite; the width, aperture and depth scales, the cavity contraction and the rim support must be positive; the contraction and the support are strictly below one, which keeps the lining contracted inside the rim and the support ring strictly between rim and floor; the roundness is within [0, 1]; the blend reach is nonnegative; and the cavity offset is three finite numbers. Nothing is mutated, and the caller's arrays are not aliased.
 *
 * These checks say the shape is constructible, not that it is a living nose: the bounds of a living nose are not encoded here.
 *
 * @evidence contracts/common.md#principled-implementation Named scale/displacement and cavity fraction checks precede a copied nasal shape.
 * @evidence contracts/common.md#clear-and-simple-design Numerical constructibility is admitted separately from later host topology and visual quality.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive finite ratios and supported contracted rings are geometric policies, not living-nose limits; no input is clamped.
 * @evidence contracts/common.md#meaningful-documentation Millimetres/degrees/dimensionless ratios retain their authored meanings and copied cavityOffset never aliases the caller.
 * @evidence contracts/performance.md#efficient-algorithms A fixed scalar list and three-coordinate offset scan take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Component preparation invokes this single shape admission owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned shallow scalar record and offset copy are owned; no geometry is allocated or input reference retained.
 */
export function resolvePortraitNoseShape(
  input: IPortraitNoseShape,
): IPortraitNoseShape & { cavityOffset: number[] } {
  const shape: { cavityOffset: number[]; widthScale: number; depthScale?: number; tipProjection: number; alarProjection: number; nostrilWidthScale: number; nostrilHeightScale: number; nostrilRise: number; nostrilTilt: number; cavityContraction: number; rimSupport: number; rimRoundness: number; blendReach: number; } = { ...input, cavityOffset: [...input.cavityOffset] };
  if (
    [
      shape.widthScale,
      shape.depthScale ?? 1,
      shape.nostrilWidthScale,
      shape.nostrilHeightScale,
      shape.cavityContraction,
      shape.rimSupport,
    ].some((v: number): boolean => !Number.isFinite(v) || v <= 0) ||
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
