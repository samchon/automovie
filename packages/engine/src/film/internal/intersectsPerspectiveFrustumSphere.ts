import {
  type IAutoMovieDeliveryCropNdc,
  type IAutoMovieIntersectsPerspectiveFrustumSphere,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { deliveryCropNdc } from "./deliveryCropNdc";

/**
 * Whether a world-space sphere may intersect a perspective-camera frustum.
 *
 * The sphere's centre is brought into the camera frame and its signed distance
 * to each of the six planes compared with the radius. Each side plane passes
 * through the lens, and its distance is normalized by the plane's own `hypot(1,
 * tangent)`, so callers must not approximate the radius by padding projected
 * NDC coordinates. Like every plane-by-plane sphere test this is conservative
 * near the frustum's edges and corners: a sphere just outside a corner yet
 * within `radius` of both adjacent planes answers true. Under exact-real
 * arithmetic the geometric approximation errs toward visible: the viewer's
 * formation culling keeps such a member drawn, and `measureAutoMovieGeometry`
 * counts it as visible. A non-finite or negative radius answers false. A
 * malformed crop throws the RangeError of deliveryCropNdc only if radius and
 * depth checks reach the side planes; an earlier false result skips that
 * conversion. Finite centres, valid lens scalars, nearly unit camera rotation
 * and representable intermediate products are premises; boundary rounding is
 * not certified.
 *
 * @param props.camera Camera placement, looking down its local −Z.
 * @param props.center Sphere centre in world metres.
 * @param props.radius Sphere radius in metres.
 * @param props.near Near clip depth in metres.
 * @param props.far Far clip depth in metres.
 * @param props.halfY Vertical half-field tangent, `tan(fovY / 2)`.
 * @param props.aspect Frame width over height.
 * @param props.crop Delivery crop, or the whole gate when omitted.
 * @returns False only when the sphere is wholly outside some frustum plane.
 */
export function intersectsPerspectiveFrustumSphere(
  props: IAutoMovieIntersectsPerspectiveFrustumSphere.IProps,
): boolean {
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(props.camera.rotation),
    Vector3.subtract(props.center, props.camera.position),
  );
  const depth: number = -local.z;
  if (
    props.radius < 0 ||
    depth + props.radius < props.near ||
    depth - props.radius > props.far
  )
    return false;
  const halfX: number = props.halfY * props.aspect;
  const crop: IAutoMovieDeliveryCropNdc = deliveryCropNdc(props.crop);
  const rightDistance: number = local.x - depth * halfX * crop.right;
  const leftDistance: number = -local.x + depth * halfX * crop.left;
  const topDistance: number = local.y - depth * props.halfY * crop.top;
  const bottomDistance: number = -local.y + depth * props.halfY * crop.bottom;
  return (
    rightDistance <= props.radius * Math.hypot(1, halfX * crop.right) &&
    leftDistance <= props.radius * Math.hypot(1, halfX * crop.left) &&
    topDistance <= props.radius * Math.hypot(1, props.halfY * crop.top) &&
    bottomDistance <= props.radius * Math.hypot(1, props.halfY * crop.bottom)
  );
}
