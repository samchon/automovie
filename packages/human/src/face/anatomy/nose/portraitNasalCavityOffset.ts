import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";

/**
 * Rotate the authored vestibular displacement with the aperture's X tilt.
 * The component's envelope path and legacy lining use this same frame so an
 * opening edit cannot leave its interior travelling along a stale direction.
 * Input and output are head-frame millimetres; tilt is in degrees.
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
