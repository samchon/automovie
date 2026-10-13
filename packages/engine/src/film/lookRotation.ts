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
 * builds the standard look-at basis instead, with camera `+Z = −direction`,
 * `x = up × z` and `y = z × x`, so the camera's local X stays horizontal. When
 * the aim is within `1e-6` of straight up or down the cross product with up
 * vanishes, so world `+Z` is the reference and the roll is whatever that
 * reference gives. A zero direction states no aim and answers the identity, the
 * camera's rest orientation looking down −Z with a level horizon. The length
 * of `direction` does not matter, and a non-finite component yields a
 * non-finite result. The result is a unit quaternion.
 *
 * @param direction World-space direction to look along, any non-zero length.
 * @returns The camera's world rotation.
 *
 * @evidence contracts/common.md#principled-implementation An orthonormal look-at basis converted to a quaternion by Shepperd's method, which takes the branch with the largest diagonal term so the divisor stays away from zero; the x-major branch is omitted because a horizontal `x` gives `x.x = z.z/h` and `y.y = h`, so `x.x > y.y` forces a positive trace, and the near-vertical fallback keeps `x.x` at about `±1` with the positive case also inside the trace branch.
 * @evidence contracts/common.md#clear-and-simple-design One aim rule shared by every camera move in `compileCameraMove` and by staging's initial aim, so a staged camera and a moving one keep the same horizon convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No direction is special-cased except the two degenerate inputs the basis cannot be built from, an up-parallel aim and a zero aim, each answered by a stated rule rather than a tuned value.
 * @evidence contracts/common.md#meaningful-documentation States the axis convention, why the horizon stays level, the up-parallel threshold and its fallback reference, the zero-direction identity, that length is ignored, the non-finite propagation, and that the result is unit length.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: two cross products, two normalizations and one square root on the chosen branch.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one vector that coordinates no work across calls; each keyframe aims along its own direction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates a few temporary vectors and retains nothing; the caller owns the returned quaternion.
 */
export function lookRotation (
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
