import { IAutoMovieDeliveryCrop, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";
import { intersectsPerspectiveFrustumSegment } from "./intersectsPerspectiveFrustumSegment";
import { resolveAutoMovieDeliveryCrop } from "./resolveAutoMovieDeliveryCrop";

interface IAutoMovieDeliveryCropNdc {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  whole: boolean;
}

const deliveryCropNdc = (
  crop: IAutoMovieDeliveryCrop | undefined,
): IAutoMovieDeliveryCropNdc => {
  const resolved = resolveAutoMovieDeliveryCrop(crop);
  return {
    left: 2 * resolved.left - 1,
    right: 2 * resolved.right - 1,
    top: 1 - 2 * resolved.top,
    bottom: 1 - 2 * resolved.bottom,
    width: resolved.right - resolved.left,
    height: resolved.bottom - resolved.top,
    whole:
      resolved.left === 0 &&
      resolved.top === 0 &&
      resolved.right === 1 &&
      resolved.bottom === 1,
  };
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

/**
 * Whether a world-space axis-aligned box intersects an exact perspective-camera
 * frustum.
 *
 * Both bodies are convex, and two convex polyhedra meet exactly when an edge of
 * one meets the other: every vertex of the intersection is a vertex of one body
 * lying inside the other, or a crossing of one body's edge with the other's
 * face, and each of those puts some edge of one body inside the other. So the
 * twelve box edges are clipped against the frustum's six half-spaces, and the
 * twelve frustum edges against the box's three slabs. Neither half alone is the
 * answer: a box small enough to sit inside the frame is found only by the
 * first, and a frustum that pierces a mass far wider than itself — a camera
 * standing inside a crowd, or above one — only by the second.
 *
 * This is what a required subject with a real extent is judged against. A
 * segment through one point cannot answer for a mass: it reports a crowd absent
 * whenever the frame holds its flank instead of its middle, and present
 * whenever that one point is on screen no matter where the rest of the unit
 * stands.
 *
 * @evidence requirements/camera/validation.md#camera-hand-computable-geometry intersectsPerspectiveFrustumBox tests all transformed box corners against explicit frustum planes, yielding a reproducible geometry result.
 * @evidence requirements/camera/scope-and-identity.md#camera-geometric-truth Tests the current world box and frustum as two resolved geometric bodies, without substituting subject labels or framing intent.
 * @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-frustum-boundaries Preserves a box or frustum edge that merely touches the other's closed planes or slabs as an intersection.
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Applies the current near and far distances while clipping both box edges and frustum edges, covering containment in either direction.
 * @evidence requirements/camera/projection-lens-and-sensor.md#camera-optical-conventions Constructs negative-Z near and far corners from vertical half-FOV and aspect, rotates them by the camera quaternion, and clips both closed bodies in one convention.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-computable-geometry-results intersectsPerspectiveFrustumBox realizes independently computable image geometry: Whether a world-space axis-aligned box intersects an exact perspective-camera frustum. Both bodies are convex, and two convex polyhedra meet exactly when an edge of one meets the other: every vertex of the intersection is a vertex of one body lying inside the other, or a crossing of one body's edge with the other's face, and each of those puts some edge of one body inside the other. So the twelve box edges are clipped against the frustum's six half-spaces, and the twelve frustum edges against the box's three slabs. Neither half alone is the answer: a box small enough to sit inside the frame is found only by the first, and a frustum that pierces a mass far wider than itself — a camera standing inside a crowd, or above one — only by the second. This is what a required subject with a real extent is judged against. A segment through one point cannot answer for a mass: it reports a crowd absent whenever the frame holds its flank instead of its middle, and present whenever that one point is on screen no matter where the rest of the unit stands.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-visibility-culling Tests both convex bodies' closed edges, preventing containment and tangent contact from being culled as invisible.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Evaluates only the current world box against the current frustum and clipping range; an authored camera declares no section plane, so the optional plane set is empty here, and it does not evaluate clearance or a swept interval.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-lens-basis-consistency Carries the same optical axis, quaternion order, FOV, aspect, and closed boundary convention through frustum-box intersection.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-camera-authority-spatial-binding Builds the frustum body from the supplied resolved camera state before testing both box and frustum edges.
 */
export const intersectsPerspectiveFrustumBox = (props: {
  camera: IAutoMovieResolvedCamera;
  min: IAutoMovieVector3;
  max: IAutoMovieVector3;
  near: number;
  far: number;
  halfY: number;
  aspect: number;
  crop?: IAutoMovieDeliveryCrop;
}): boolean => {
  const corners = [props.min.x, props.max.x].flatMap((x) =>
    [props.min.y, props.max.y].flatMap((y) =>
      [props.min.z, props.max.z].map((z) => ({ x, y, z })),
    ),
  );
  for (const [from, to] of BOX_EDGES)
    if (
      intersectsPerspectiveFrustumSegment({
        camera: props.camera,
        from: corners[from]!,
        to: corners[to]!,
        near: props.near,
        far: props.far,
        halfY: props.halfY,
        aspect: props.aspect,
        crop: props.crop,
      })
    )
      return true;
  const lens = frustumCorners(props);
  for (const [from, to] of BOX_EDGES)
    if (segmentMeetsBox(lens[from]!, lens[to]!, props.min, props.max))
      return true;
  return false;
};
