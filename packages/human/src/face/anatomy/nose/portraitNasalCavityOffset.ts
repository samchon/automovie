import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";

/**
 * Rotate the authored vestibular displacement with the aperture's X tilt. The nostril lining uses this rotated offset after fitting its rim. Input and output are head-frame millimetres; tilt is in degrees.
 *
 * @evidence contracts/common.md#principled-implementation Authored vestibular displacement rotates its Y/Z components by the same aperture X tilt.
 * @evidence contracts/common.md#clear-and-simple-design Legacy nostril attachment reuses this field after the aperture's fitted rim is established.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The offset is an authored cavity hypothesis rather than measured airway direction or collision guarantee.
 * @evidence contracts/common.md#meaningful-documentation Input/output distances are head millimetres and tilt is degrees.
 * @evidence contracts/performance.md#efficient-algorithms Two trigonometric values and fixed coordinate arithmetic take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work appendPortraitNostrils computes this common offset once for its rings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the new three-component array escapes and the shape stays unchanged.
 */
export function portraitNasalCavityOffset(shape: IPortraitNoseShape): number[] {
  const angle: number = (shape.nostrilTilt * Math.PI) / 180;
  return [
    shape.cavityOffset[0],
    shape.cavityOffset[1] * Math.cos(angle) -
      shape.cavityOffset[2] * Math.sin(angle),
    shape.cavityOffset[1] * Math.sin(angle) +
      shape.cavityOffset[2] * Math.cos(angle),
  ];
}
