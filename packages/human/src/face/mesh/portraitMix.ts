/**
 * Linear interpolation; callers decide whether extrapolation is meaningful.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Supplies scalar interpolation used by the anatomical curve and surface builders.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Evaluates the common affine blend while leaving extrapolation policy to the owning section.
 */
export const portraitMix = (a: number, b: number, t: number): number =>
  a + (b - a) * t;
