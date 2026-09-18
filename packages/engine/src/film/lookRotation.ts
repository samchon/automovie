import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * The rotation that points a camera's −Z down `direction` while keeping its
 * horizon level (world-up stabilized), what a shortest-arc `aimRotation` cannot
 * do: the shortest arc from −Z rolls the frame on off-axis aims, which the
 * demo's orbit shot exposed as a tilted horizon. Standard look-at basis (x = up
 * × z, y = z × x) converted to a quaternion; aiming straight up/down
 * degenerates the cross product, so +Z steps in as the reference.
 *
 * @evidence requirements/camera/scope-and-identity.md#camera-spatial-state-binding Constructs a world-up-stabilized quaternion that points camera −Z at the authored direction without rolling the horizon.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-camera-authority-spatial-binding lookRotation realizes explicit camera spatial binding: The rotation that points a camera's −Z down `direction` while keeping its horizon level (world-up stabilized), what a shortest-arc `aimRotation` cannot do: the shortest arc from −Z rolls the frame on off-axis aims, which the demo's orbit shot exposed as a tilted horizon. Standard look-at basis (x = up × z, y = z × x) converted to a quaternion; aiming straight up/down degenerates the cross product, so +Z steps in as the reference.
 */
export const lookRotation = (
  direction: IAutoMovieVector3,
): IAutoMovieQuaternion => {
  const z = Vector3.scale(Vector3.normalize(direction), -1); // camera +Z = back
  let x = Vector3.cross(UP, z);
  if (Vector3.length(x) < 1e-6) x = Vector3.cross({ x: 0, y: 0, z: 1 }, z);
  x = Vector3.normalize(x);
  const y = Vector3.cross(z, x);
  // Basis → quaternion (Shepperd's method, w-branch first). The usual
  // x-major branch is provably unreachable here: this basis keeps x
  // horizontal, so x.x = z.z/h and y.y = h ≥ 0 (h = |(z.x, z.z)|), and
  // x.x > y.y forces trace = x.x + y.y + z.z > 0. The w-branch already
  // took it. Only w / y-major / z-major remain.
  const trace = x.x + y.y + z.z;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    return Quaternion.normalize({
      w: s / 4,
      x: (y.z - z.y) / s,
      y: (z.x - x.z) / s,
      z: (x.y - y.x) / s,
    });
  }
  if (y.y > z.z) {
    const s = Math.sqrt(1 + y.y - x.x - z.z) * 2;
    return Quaternion.normalize({
      w: (z.x - x.z) / s,
      x: (y.x + x.y) / s,
      y: s / 4,
      z: (z.y + y.z) / s,
    });
  }
  const s = Math.sqrt(1 + z.z - x.x - y.y) * 2;
  return Quaternion.normalize({
    w: (x.y - y.x) / s,
    x: (z.x + x.z) / s,
    y: (z.y + y.z) / s,
    z: s / 4,
  });
};
