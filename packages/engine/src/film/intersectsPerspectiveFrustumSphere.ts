import { IAutoMovieDeliveryCrop, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";

/**
 * Whether a world-space sphere intersects an exact perspective-camera frustum.
 * Side-plane distances include plane normalization, so callers must not
 * approximate the radius by padding projected NDC coordinates.
 *
 * @evidence requirements/camera/validation.md#camera-hand-computable-geometry intersectsPerspectiveFrustumSphere keeps camera geometry hand-computable: Whether a world-space sphere intersects an exact perspective-camera frustum. Side-plane distances include plane normalization, so callers must not approximate the radius by padding projected NDC coordinates.
 * @evidence requirements/camera/scope-and-identity.md#camera-geometric-truth Measures the current world-space sphere against planes derived from the resolved camera origin and orientation, independent of authored intent.
 * @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-frustum-boundaries Keeps a sphere tangent to a near, far, or normalized side plane visible by rejecting only strict separation from the closed frustum.
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Tests the sphere's radius-adjusted depth against the declared near and far distances before its side-plane bounds.
 * @evidence requirements/camera/projection-lens-and-sensor.md#camera-optical-conventions Transforms the sphere center by the inverse camera quaternion, reads positive depth along negative Z, and tests normalized FOV-and-aspect side planes as closed boundaries.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-computable-geometry-results intersectsPerspectiveFrustumSphere realizes independently computable image geometry: Whether a world-space sphere intersects an exact perspective-camera frustum. Side-plane distances include plane normalization, so callers must not approximate the radius by padding projected NDC coordinates.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-visibility-culling Uses normalized plane distances and strict outside tests so exact sphere-boundary contact remains render-visible.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Evaluates only the current sphere bound against the current frustum and clipping range with an empty optional plane set; it does not claim clearance or swept-motion coverage.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-lens-basis-consistency Applies the same optical axis, transform order, vertical FOV, aspect, depth, and closed-boundary convention to spherical bounds.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-camera-authority-spatial-binding Transforms the sphere through the supplied resolved camera state before applying current depth and side-plane bounds.
 */
export const intersectsPerspectiveFrustumSphere = (props: {
  camera: IAutoMovieResolvedCamera;
  center: IAutoMovieVector3;
  radius: number;
  near: number;
  far: number;
  halfY: number;
  aspect: number;
  crop?: IAutoMovieDeliveryCrop;
}): boolean => {
  const local = Quaternion.rotateVector(
    Quaternion.inverse(props.camera.rotation),
    Vector3.subtract(props.center, props.camera.position),
  );
  const depth = -local.z;
  if (
    Number.isFinite(props.radius) === false ||
    props.radius < 0 ||
    depth + props.radius < props.near ||
    depth - props.radius > props.far
  )
    return false;
  const halfX = props.halfY * props.aspect;
  const crop = deliveryCropNdc(props.crop);
  const rightDistance = local.x - depth * halfX * crop.right;
  const leftDistance = -local.x + depth * halfX * crop.left;
  const topDistance = local.y - depth * props.halfY * crop.top;
  const bottomDistance = -local.y + depth * props.halfY * crop.bottom;
  return (
    rightDistance <= props.radius * Math.hypot(1, halfX * crop.right) &&
    leftDistance <= props.radius * Math.hypot(1, halfX * crop.left) &&
    topDistance <= props.radius * Math.hypot(1, props.halfY * crop.top) &&
    bottomDistance <= props.radius * Math.hypot(1, props.halfY * crop.bottom)
  );
};
