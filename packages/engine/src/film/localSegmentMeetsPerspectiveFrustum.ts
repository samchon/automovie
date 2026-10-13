import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieDeliveryCropNdc } from "./IAutoMovieDeliveryCropNdc";

/**
 * Whether a camera-local segment meets a perspective frustum, its faces
 * included.
 *
 * Both ends are already in the camera's frame, looking down −Z with +Y up, so
 * a caller testing many segments of one body transforms each corner once
 * rather than once per segment. The frustum is bounded by the `near` and `far`
 * depths and by the side planes through the lens and the crop's NDC edges at
 * `halfX` and `halfY` tangents. A segment touching a face counts as meeting it.
 *
 * @param props.from Segment start in camera-local metres.
 * @param props.to Segment end in camera-local metres.
 * @param props.near Near clip depth in metres, in front of the lens.
 * @param props.far Far clip depth in metres, beyond `near`.
 * @param props.halfX Horizontal half-field tangent, `tan(fovY / 2) · aspect`.
 * @param props.halfY Vertical half-field tangent, `tan(fovY / 2)`.
 * @param props.crop The delivery crop in NDC, from {@link deliveryCropNdc}.
 * @returns True when some point of the segment lies inside or on the frustum.
 *
 * @evidence contracts/common.md#principled-implementation Cyrus-Beck clipping of the segment parameter `[0, 1]` against six half-spaces `f(p) <= 0`, each linear in camera-local coordinates because the viewing depth is `-p.z`, so every crossing is exact; a segment parallel to a plane is decided by the sign at its start, and the frustum's convexity makes the surviving interval the whole intersection.
 * @evidence contracts/common.md#clear-and-simple-design The clipping core shared by the world-space segment test and the box test, so the box no longer re-transforms each corner and re-validates the crop for every one of its twelve edges.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every segment is clipped against the same six planes with no tolerance or sampled point; boundary contact counts as inside by the stated rule.
 * @evidence contracts/common.md#meaningful-documentation States the frame and axis convention of the inputs, how the frustum is bounded, the meaning and units of each parameter, and that touching a face counts.
 * @evidence contracts/performance.md#efficient-algorithms Constant time and space: six plane evaluations at each end and one interval update per plane, with no allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate over one segment; the reuse of transformed corners across segments is the caller's, which is why the inputs are camera-local.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains and allocates nothing beyond a few scalars for the call.
 */
export const localSegmentMeetsPerspectiveFrustum = (props: {
  from: IAutoMovieVector3;
  to: IAutoMovieVector3;
  near: number;
  far: number;
  halfX: number;
  halfY: number;
  crop: IAutoMovieDeliveryCropNdc;
}): boolean => {
  let lower: number = 0;
  let upper: number = 1;
  for (let plane: number = 0; plane < 6; ++plane) {
    const at0: number = planeValue(props, plane, props.from);
    const at1: number = planeValue(props, plane, props.to);
    const slope: number = at1 - at0;
    // Parallel to the plane: the whole segment is on one side of it, so the
    // sign at either end decides, and there is no crossing to narrow with.
    if (slope === 0) {
      if (at0 > 0) return false;
      continue;
    }
    const crossing: number = -at0 / slope;
    if (slope > 0) upper = Math.min(upper, crossing);
    else lower = Math.max(lower, crossing);
    if (lower > upper) return false;
  }
  return true;
};

/**
 * One of the six frustum half-spaces at a camera-local point, written so the
 * inside is `<= 0`: near, far, right, left, top, bottom in that order.
 */
const planeValue = (
  frustum: {
    near: number;
    far: number;
    halfX: number;
    halfY: number;
    crop: IAutoMovieDeliveryCropNdc;
  },
  plane: number,
  point: IAutoMovieVector3,
): number => {
  switch (plane) {
    case 0:
      return frustum.near + point.z;
    case 1:
      return -point.z - frustum.far;
    case 2:
      return point.x + frustum.crop.right * point.z * frustum.halfX;
    case 3:
      return -point.x - frustum.crop.left * point.z * frustum.halfX;
    case 4:
      return point.y + frustum.crop.top * point.z * frustum.halfY;
    default:
      return -point.y - frustum.crop.bottom * point.z * frustum.halfY;
  }
};
