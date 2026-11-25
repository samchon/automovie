import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** World up: the horizon a camera keeps level. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The reference that replaces {@link UP} when the aim is parallel to it. */
const BACK: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * The rotation that points a camera's −Z down `direction` while keeping its
 * horizon level.
 *
 * A shortest-arc rotation from −Z rolls the frame on an off-axis aim; this one
 * builds the standard look-at basis instead, with camera `+Z = −direction`, `x
 * = up × z` and `y = z × x`, so the camera's local X stays horizontal. When the
 * normalized aim's cross product with up has length below `1e-6`, world `+Z` is
 * the reference and the roll is whatever that reference gives. A zero direction
 * states no aim and answers the identity, the camera's rest orientation looking
 * down −Z with a level horizon. Finite direction length does not matter; finite
 * inputs yield a unit quaternion up to rounding, while a non-finite component
 * yields a non-finite result.
 *
 * @param direction World-space direction to look along, any non-zero length.
 * @returns The camera's world rotation.
 */
export function lookRotation(
  direction: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const z: IAutoMovieVector3 = Vector3.scale(Vector3.normalize(direction), -1);
  if (z.x === 0 && z.y === 0 && z.z === 0) return Quaternion.identity();
  let x: IAutoMovieVector3 = Vector3.cross(UP, z);
  if (Vector3.length(x) < 1e-6) x = Vector3.cross(BACK, z);
  x = Vector3.normalize(x);
  const y: IAutoMovieVector3 = Vector3.cross(z, x);
  const trace: number = x.x + y.y + z.z;
  if (trace > 0) {
    const s: number = Math.sqrt(trace + 1) * 2;
    return Quaternion.normalize({
      w: s / 4,
      x: (y.z - z.y) / s,
      y: (z.x - x.z) / s,
      z: (x.y - y.x) / s,
    });
  }
  if (y.y > z.z) {
    const s: number = Math.sqrt(1 + y.y - x.x - z.z) * 2;
    return Quaternion.normalize({
      w: (z.x - x.z) / s,
      x: (y.x + x.y) / s,
      y: s / 4,
      z: (z.y + y.z) / s,
    });
  }
  const s: number = Math.sqrt(1 + z.z - x.x - y.y) * 2;
  return Quaternion.normalize({
    w: (x.y - y.x) / s,
    x: (z.x + x.z) / s,
    y: (z.y + y.z) / s,
    z: s / 4,
  });
}
