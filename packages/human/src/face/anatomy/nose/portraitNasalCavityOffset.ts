import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";

/**
 * Rotate the authored vestibular displacement with the aperture's X tilt.
 * The component's envelope path and legacy lining use this same frame so an
 * opening edit cannot leave its interior travelling along a stale direction.
 * Input and output are head-frame millimetres; tilt is in degrees.
 *
 * @evidence contracts/common.md#principled-implementation Rotating the authored (x,y,z) offset about the head X axis by the tilt, y'=y cos t - z sin t and z'=y sin t + z cos t, is the same rotation the nose component applies to the aperture, so lining and rim share one frame.
 * @evidence contracts/common.md#clear-and-simple-design One rotation, owned here, that the lining reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject special-casing; the result follows the offset and the tilt.
 * @evidence contracts/common.md#meaningful-documentation The comment states the shared frame, the units and that the tilt is in degrees.
 * @evidence contracts/modeling.md#spatial-conventions Input and output are head-frame millimetres with +X anatomical left, +Y up, +Z anterior; tilt is degrees about +X and is converted to radians here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nasal aperture owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no mesh primitives; it returns values for its caller to place.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part; the callers that share its result own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; callers admit theirs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on values its owner already named, not an input through which a caller shapes a human form.
 */
export function portraitNasalCavityOffset(shape: IPortraitNoseShape): number[] {
  const angle = (shape.nostrilTilt * Math.PI) / 180;
  return [
    shape.cavityOffset[0],
    shape.cavityOffset[1] * Math.cos(angle) -
      shape.cavityOffset[2] * Math.sin(angle),
    shape.cavityOffset[1] * Math.sin(angle) +
      shape.cavityOffset[2] * Math.cos(angle),
  ];
}
