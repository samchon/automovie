import { IAutoMovieDeliveryCrop, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";

/**
 * Whether a world-space segment intersects an exact perspective-camera frustum.
 *
 * The frustum is the intersection of six half-spaces, so it is convex and the
 * segment can be clipped against them one plane at a time in its own parameter.
 * Each plane is linear in camera-local coordinates, which makes every crossing
 * exact rather than sampled. That exactness is the reason this exists: a close
 * shot frames the band between roughly 0.71 and 0.99 of a subject's height, so
 * **neither end** of the subject is on screen while its middle fills the frame.
 * Testing chosen points — the base, the top, the midpoint — reports such a
 * subject absent; clipping finds it.
 *
 * @evidence requirements/camera/validation.md#camera-hand-computable-geometry intersectsPerspectiveFrustumSegment reduces segment visibility to explicit perspective-plane clipping that can be checked independently.
 * @evidence requirements/camera/scope-and-identity.md#camera-geometric-truth Clips the world segment against half-spaces derived from the resolved camera transform and current lens geometry, not an authored composition claim.
 * @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-frustum-boundaries Treats equality with every near, far, and side half-space as visible, so a segment touching a closed frustum boundary intersects.
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Uses the declared near and far planes in the exact segment clip instead of sampling selected points or ignoring depth.
 * @evidence requirements/camera/projection-lens-and-sensor.md#camera-optical-conventions Builds six closed camera-local half-spaces from inverse-quaternion rotation, negative-Z depth, vertical half-FOV, and width-to-height aspect.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-computable-geometry-results intersectsPerspectiveFrustumSegment realizes independently computable image geometry: Whether a world-space segment intersects an exact perspective-camera frustum. The frustum is the intersection of six half-spaces, so it is convex and the segment can be clipped against them one plane at a time in its own parameter. Each plane is linear in camera-local coordinates, which makes every crossing exact rather than sampled. That exactness is the reason this exists: a close shot frames the band between roughly 0.71 and 0.99 of a subject's height, so **neither end** of the subject is on screen while its middle fills the frame. Testing chosen points — the base, the top, the midpoint — reports such a subject absent; clipping finds it.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-visibility-culling Clips the complete segment against all six closed frustum half-spaces, preserving boundary contact as visible geometry.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Evaluates only this segment against the current near, far, and side planes; the optional clipping-plane set is empty for an authored camera, and it does not claim camera-body clearance or swept-motion safety.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-lens-basis-consistency Uses the declared perspective basis for every segment-plane crossing and preserves equality with a near, far, or image-edge plane.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-camera-authority-spatial-binding Derives every segment-frustum plane test from the supplied resolved camera state and current geometric bounds.
 */
export const intersectsPerspectiveFrustumSegment = (props: {
  camera: IAutoMovieResolvedCamera;
  from: IAutoMovieVector3;
  to: IAutoMovieVector3;
  near: number;
  far: number;
  halfY: number;
  aspect: number;
  crop?: IAutoMovieDeliveryCrop;
}): boolean => {
  const inverse = Quaternion.inverse(props.camera.rotation);
  const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      inverse,
      Vector3.subtract(point, props.camera.position),
    );
  const from = local(props.from);
  const to = local(props.to);
  const halfX = props.halfY * props.aspect;
  const crop = deliveryCropNdc(props.crop);
  // Six half-spaces, each written as `f(p) <= 0`. The camera looks down its
  // local −Z, so the viewing depth is `-p.z` and the side planes open with it.
  const planes: ((point: IAutoMovieVector3) => number)[] = [
    (point) => props.near + point.z,
    (point) => -point.z - props.far,
    (point) => point.x + crop.right * point.z * halfX,
    (point) => -point.x - crop.left * point.z * halfX,
    (point) => point.y + crop.top * point.z * props.halfY,
    (point) => -point.y - crop.bottom * point.z * props.halfY,
  ];
  let lower = 0;
  let upper = 1;
  for (const plane of planes) {
    const at0 = plane(from);
    const at1 = plane(to);
    const slope = at1 - at0;
    // Parallel to the plane: the whole segment is on one side of it, so the
    // sign at either end decides, and there is no crossing to narrow with.
    if (slope === 0) {
      if (at0 > 0) return false;
      continue;
    }
    const crossing = -at0 / slope;
    if (slope > 0) upper = Math.min(upper, crossing);
    else lower = Math.max(lower, crossing);
    if (lower > upper) return false;
  }
  return true;
};

/** The eight world corners of a perspective frustum, near plane first. */
const frustumCorners = (props: {
  camera: IAutoMovieResolvedCamera;
  near: number;
  far: number;
  halfY: number;
  aspect: number;
  crop?: IAutoMovieDeliveryCrop;
}): IAutoMovieVector3[] => {
  const halfX = props.halfY * props.aspect;
  const crop = deliveryCropNdc(props.crop);
  return [props.near, props.far].flatMap((depth) =>
    [crop.left, crop.right].flatMap((sx) =>
      [crop.bottom, crop.top].map((sy) =>
        Vector3.add(
          props.camera.position,
          Quaternion.rotateVector(props.camera.rotation, {
            x: sx * depth * halfX,
            y: sy * depth * props.halfY,
            z: -depth,
          }),
        ),
      ),
    ),
  );
};

/**
 * The twelve edges of any eight-corner box, as index pairs.
 *
 * Both corner lists below are built by nesting three two-valued choices, so a
 * corner's index is those three choices read as bits and an edge is a pair
 * differing in exactly one of them. The same twelve pairs therefore name the
 * box's edges and the frustum's.
 */
const BOX_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0, 2],
  [0, 4],
  [1, 3],
  [1, 5],
  [2, 3],
  [2, 6],
  [3, 7],
  [4, 5],
  [4, 6],
  [5, 7],
  [6, 7],
];

/** Whether a world-space segment meets an axis-aligned box (slab clipping). */
const segmentMeetsBox = (
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
): boolean => {
  let lower = 0;
  let upper = 1;
  for (const axis of ["x", "y", "z"] as const) {
    const start = from[axis];
    const slope = to[axis] - start;
    // Parallel to this pair of slabs: the whole segment shares one coordinate,
    // so the slab decides it outright and there is no crossing to narrow with.
    if (slope === 0) {
      if (start < min[axis] || start > max[axis]) return false;
      continue;
    }
    const first = (min[axis] - start) / slope;
    const second = (max[axis] - start) / slope;
    lower = Math.max(lower, Math.min(first, second));
    upper = Math.min(upper, Math.max(first, second));
    if (lower > upper) return false;
  }
  return true;
};
