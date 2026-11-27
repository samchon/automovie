import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { PhysicalRotationVector } from "../PhysicalRotationVector";

/*
 * A joint rotation brought inside its clinical swing-twist limit (Baerlocher
 * and Boulic 2001, "Parametrization and range of motion of the ball-and-socket
 * joint", The Visual Computer 17(7)).
 *
 * The rotation splits as `q = swing * twist`: the twist is the rotation about
 * the twist axis `a` with the same projection, `twist = normalize(w, (v . a)
 * a)`, and the swing is `q * twist^-1`, a rotation about an axis perpendicular
 * to `a`. The twist angle is clamped into its range. The swing's rotation
 * vector has components `u` and `v` about the two swing axes; outside the
 * quadrant's ellipse `(u / U)^2 + (v / V)^2 <= 1`, with `U` and `V` the range
 * ends on the vector's side, it is scaled back onto the ellipse along its own
 * direction. The limited rotation is the limited swing times the limited twist;
 * a rotation inside the limit is returned as given.
 * Parameter limit: The joint's swing-twist limit.
 * Parameter rotation: The joint frame's relative rotation.
 * Returns: The limited rotation.
 */
export function limitPhysicalSwingTwist(
  limit: IAutoMoviePhysicalJoint.ISwingTwist,
  rotation: IAutoMovieQuaternion,
): IAutoMovieQuaternion {
  const q: IAutoMovieQuaternion =
    rotation.w < 0
      ? { x: -rotation.x, y: -rotation.y, z: -rotation.z, w: -rotation.w }
      : rotation;
  const a: IAutoMovieVector3 = limit.twistAxis;
  const projection: number = q.x * a.x + q.y * a.y + q.z * a.z;
  const norm: number = Math.hypot(q.w, projection);
  const twist: IAutoMovieQuaternion =
    norm > 0
      ? {
          x: (a.x * projection) / norm,
          y: (a.y * projection) / norm,
          z: (a.z * projection) / norm,
          w: q.w / norm,
        }
      : { x: 0, y: 0, z: 0, w: 1 };
  const swing: IAutoMovieQuaternion = Quaternion.multiply(
    q,
    Quaternion.inverse(twist),
  );
  const angle: number = 2 * Math.atan2(projection, q.w);
  const limitedAngle: number = Math.max(
    limit.twist.minimum,
    Math.min(limit.twist.maximum, angle),
  );
  const vector: IAutoMovieVector3 = PhysicalRotationVector.log(swing);
  const v: IAutoMovieVector3 = Vector3.cross(a, limit.swingAxis);
  const su: number = Vector3.dot(vector, limit.swingAxis);
  const sv: number = Vector3.dot(vector, v);
  const bu: number = su >= 0 ? limit.swingU.maximum : -limit.swingU.minimum;
  const bv: number = sv >= 0 ? limit.swingV.maximum : -limit.swingV.minimum;
  const measure: number =
    (bu > 0 ? (su / bu) ** 2 : su === 0 ? 0 : Infinity) +
    (bv > 0 ? (sv / bv) ** 2 : sv === 0 ? 0 : Infinity);
  if (measure <= 1 && limitedAngle === angle) return rotation;
  const shrink: number = measure > 1 ? 1 / Math.sqrt(measure) : 1;
  const limitedSwing: IAutoMovieQuaternion = PhysicalRotationVector.exp(
    Vector3.add(
      Vector3.scale(limit.swingAxis, su * shrink),
      Vector3.scale(v, sv * shrink),
    ),
  );
  const limitedTwist: IAutoMovieQuaternion = PhysicalRotationVector.exp(
    Vector3.scale(a, limitedAngle),
  );
  return Quaternion.multiply(limitedSwing, limitedTwist);
}
