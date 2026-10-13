import {
  IAutoMovieDeliveryCrop,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieDeliveryCropNdc } from "./IAutoMovieDeliveryCropNdc";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";
import { deliveryCropNdc } from "./deliveryCropNdc";
import { localSegmentMeetsPerspectiveFrustum } from "./localSegmentMeetsPerspectiveFrustum";

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
 * first, and a frustum that pierces a mass far wider than itself, a camera
 * standing inside a crowd or above one, only by the second. Touching counts as
 * meeting, and a malformed crop throws the `RangeError` of
 * {@link deliveryCropNdc}.
 *
 * This is what a required subject with a real extent is judged against in
 * `realizeShotContract`. A segment through one point cannot answer for a mass:
 * it reports a crowd absent whenever the frame holds its flank instead of its
 * middle, and present whenever that one point is on screen no matter where the
 * rest of the unit stands.
 *
 * @param props.camera Camera placement, looking down its local −Z.
 * @param props.min Minimum world corner of the box, in metres.
 * @param props.max Maximum world corner of the box, in metres.
 * @param props.near Near clip depth in metres.
 * @param props.far Far clip depth in metres.
 * @param props.halfY Vertical half-field tangent, `tan(fovY / 2)`.
 * @param props.aspect Frame width over height.
 * @param props.crop Delivery crop, or the whole gate when omitted.
 * @returns True when the box and the frustum share at least one point.
 *
 * @evidence contracts/common.md#principled-implementation The edge-crossing criterion for two convex polyhedra: box edges are clipped by Cyrus-Beck against the frustum planes in camera space, and frustum edges by slab clipping against the box in world space, which together are exact for any non-degenerate pair; the premise is an ordered box and a unit camera rotation.
 * @evidence contracts/common.md#clear-and-simple-design Shares the camera-space clipping core with the segment test and the crop conversion with the projection, keeping only the two edge sweeps and the slab test that belong to a box.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither body is sampled at chosen points and no tolerance widens either; both halves of the criterion always run until one finds a crossing.
 * @evidence contracts/common.md#meaningful-documentation States why both edge sweeps are needed, with the case each alone misses, that touching counts, the crop error, who judges against it, and each parameter's frame and units.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: the eight box corners are transformed into camera space once and the crop converted once for all twelve clips, instead of two rotations and a crop validation per edge, then at most twelve slab tests over the eight frustum corners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate over one box and one camera that coordinates no work across calls; the grader calls it once per sampled instant.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates sixteen corner vectors for the call and retains nothing.
 */
export function intersectsPerspectiveFrustumBox (props: {
  camera: IAutoMovieResolvedCamera;
  min: IAutoMovieVector3;
  max: IAutoMovieVector3;
  near: number;
  far: number;
  halfY: number;
  aspect: number;
  crop?: IAutoMovieDeliveryCrop;
}): boolean {
  const crop: IAutoMovieDeliveryCropNdc = deliveryCropNdc(props.crop);
  const halfX: number = props.halfY * props.aspect;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(
    props.camera.rotation,
  );
  const corners: IAutoMovieVector3[] = boxCorners(props.min, props.max).map(
    (corner: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(corner, props.camera.position),
      ),
  );
  for (const [from, to] of BOX_EDGES)
    if (
      localSegmentMeetsPerspectiveFrustum({
        from: corners[from]!,
        to: corners[to]!,
        near: props.near,
        far: props.far,
        halfX,
        halfY: props.halfY,
        crop,
      })
    )
      return true;
  const lens: IAutoMovieVector3[] = frustumCorners(props, halfX, crop);
  for (const [from, to] of BOX_EDGES)
    if (segmentMeetsBox(lens[from]!, lens[to]!, props.min, props.max))
      return true;
  return false;
}

/** The eight corners of a box, indexed by the x, y, z choice bits. */
function boxCorners (
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
): IAutoMovieVector3[] { return [min.x, max.x].flatMap((x: number): IAutoMovieVector3[] =>
    [min.y, max.y].flatMap((y: number): IAutoMovieVector3[] =>
      [min.z, max.z].map((z: number): IAutoMovieVector3 => ({ x, y, z })),
    ),
  ); }

/** The eight world corners of a perspective frustum, near plane first. */
function frustumCorners (
  props: {
    camera: IAutoMovieResolvedCamera;
    near: number;
    far: number;
    halfY: number;
  },
  halfX: number,
  crop: IAutoMovieDeliveryCropNdc,
): IAutoMovieVector3[] { return [props.near, props.far].flatMap((depth: number): IAutoMovieVector3[] =>
    [crop.left, crop.right].flatMap((sx: number): IAutoMovieVector3[] =>
      [crop.bottom, crop.top].map(
        (sy: number): IAutoMovieVector3 =>
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
  ); }

/** Whether a world-space segment meets an axis-aligned box (slab clipping). */
function segmentMeetsBox (
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
): boolean {
  let lower: number = 0;
  let upper: number = 1;
  for (const axis of ["x", "y", "z"] as const) {
    const start: number = from[axis];
    const slope: number = to[axis] - start;
    // Parallel to this pair of slabs: the whole segment shares one coordinate,
    // so the slab decides it outright and there is no crossing to narrow with.
    if (slope === 0) {
      if (start < min[axis] || start > max[axis]) return false;
      continue;
    }
    const first: number = (min[axis] - start) / slope;
    const second: number = (max[axis] - start) / slope;
    lower = Math.max(lower, Math.min(first, second));
    upper = Math.min(upper, Math.max(first, second));
    if (lower > upper) return false;
  }
  return true;
}
