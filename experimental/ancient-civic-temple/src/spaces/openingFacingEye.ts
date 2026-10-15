import { builtSpaceVolumeBounds, builtSpaceContainsPoint } from "@automovie/engine";
import type { IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Follow the opening's actual host normal toward the compiled room centre, then stand back from its far wall.
 */


export const openingFacingEye = (
  space: IAutoMovieBuiltSpace, mouth: IAutoMovieVector3, normal: IAutoMovieVector3, anchor: IAutoMovieVector3,
  eyeHeight: number, desiredDistance: number
): IAutoMovieVector3 | null => {
  const bounds = builtSpaceVolumeBounds(space);
  if (bounds === null) return null;
  const length = Math.hypot(normal.x, normal.z);
  if (length < 1e-9) return null;
  const reach = Math.hypot(bounds.max.x - bounds.min.x, bounds.max.z - bounds.min.z) + 1;
  const at = (sign: number, distance: number): IAutoMovieVector3 => ({
    x: mouth.x + sign * normal.x / length * distance,
    y: eyeHeight,
    z: mouth.z + sign * normal.z / length * distance,
  });
  const direction = (anchor.x - mouth.x) * normal.x + (anchor.z - mouth.z) * normal.z;
  if (Math.abs(direction) < 1e-9) return null;
  const side = Math.sign(direction);
  let farthest = 0;
  for (let index = 1; index / 10 <= reach; index++) {
    if (builtSpaceContainsPoint(space, at(side, index / 10))) farthest = index / 10;
  }
  const setback = Math.min(0.3, farthest / 2);
  const position = at(side, Math.min(farthest - setback, desiredDistance));
  return builtSpaceContainsPoint(space, position) ? position : null;
};
