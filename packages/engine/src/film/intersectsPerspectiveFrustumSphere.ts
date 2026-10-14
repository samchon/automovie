import {
  IAutoMovieDeliveryCrop,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieDeliveryCropNdc } from "./IAutoMovieDeliveryCropNdc";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";
import { deliveryCropNdc } from "./deliveryCropNdc";

/**
 * Whether a world-space sphere may intersect a perspective-camera frustum.
 *
 * The sphere's centre is brought into the camera frame and its signed distance to each of the six planes compared with the radius. Each side plane passes through the lens, and its distance is normalized by the plane's own `hypot(1, tangent)`, so callers must not approximate the radius by padding projected NDC coordinates. Like every plane-by-plane sphere test this is conservative near the frustum's edges and corners: a sphere just outside a corner yet within `radius` of both adjacent planes answers true. Under exact-real arithmetic the geometric approximation errs toward visible: the viewer's formation culling keeps such a member drawn, and `measureAutoMovieGeometry` counts it as visible. A non-finite or negative radius answers false. A malformed crop throws the RangeError of deliveryCropNdc only if radius and depth checks reach the side planes; an earlier false result skips that conversion. Finite centres, valid lens scalars, nearly unit camera rotation and representable intermediate products are premises; boundary rounding is not certified.
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
 *
 * @evidence contracts/common.md#principled-implementation The standard sphere-versus-half-space test against each of the six frustum planes, with each side plane `x - t·d = 0` normalized by `hypot(1, t)` so the comparison is a true Euclidean distance; the exact-real method rejects a sphere outside one plane and is conservative at edges and corners. Floating products and boundary rounding retain the stated numerical limits.
 * @evidence contracts/common.md#clear-and-simple-design The crop conversion is the shared `deliveryCropNdc`; this function keeps only the distance comparisons, serving the geometry measurement and the viewer's formation culling with one rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance pads the radius and no camera or subject is special-cased; the invalid-radius refusal applies to every caller alike.
 * @evidence contracts/common.md#meaningful-documentation States the plane normalization and why NDC padding is wrong, the conservative edge and corner behaviour and what each caller does with it, the invalid-radius answer, the crop error, and each parameter's frame and units.
 * @evidence contracts/performance.md#efficient-algorithms Constant local work performs one inverse rotation, at most one crop conversion and six plane comparisons; no performance measurement or frame-time budget is claimed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate over one sphere and one camera that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The camera-local centre and the NDC crop are garbage on return, and the predicate keeps no reference to the camera or sphere.
 */
export function intersectsPerspectiveFrustumSphere (props: {
  camera: IAutoMovieResolvedCamera;
  center: IAutoMovieVector3;
  radius: number;
  near: number;
  far: number;
  halfY: number;
  aspect: number;
  crop?: IAutoMovieDeliveryCrop;
}): boolean {
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(props.camera.rotation),
    Vector3.subtract(props.center, props.camera.position),
  );
  const depth: number = -local.z;
  if (
    Number.isFinite(props.radius) === false ||
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
