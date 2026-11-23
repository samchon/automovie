import {
  type IAutoMovieDeliveryCropNdc,
  type IAutoMovieLocalSegmentMeetsPerspectiveFrustum,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Whether a camera-local segment meets a perspective frustum, its faces
 * included.
 *
 * Both ends are already in the camera's frame, looking down −Z with +Y up, so a
 * caller testing many segments of one body transforms each corner once rather
 * than once per segment. The frustum is bounded by the `near` and `far` depths
 * and by the side planes through the lens and the crop's NDC edges at `halfX`
 * and `halfY` tangents. A segment touching a face counts as meeting it.
 *
 * @param props.from Segment start in camera-local metres.
 * @param props.to Segment end in camera-local metres.
 * @param props.near Near clip depth in metres, in front of the lens.
 * @param props.far Far clip depth in metres, beyond `near`.
 * @param props.halfX Horizontal half-field tangent, `tan(fovY / 2) · aspect`.
 * @param props.halfY Vertical half-field tangent, `tan(fovY / 2)`.
 * @param props.crop The delivery crop in NDC, from {@link deliveryCropNdc}.
 * @returns True when some point of the segment lies inside or on the frustum.
 */
export function localSegmentMeetsPerspectiveFrustum(
  props: IAutoMovieLocalSegmentMeetsPerspectiveFrustum.IProps,
): boolean {
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
}

/**
 * One of the six frustum half-spaces at a camera-local point, written so the
 * inside is `<= 0`: near, far, right, left, top, bottom in that order.
 */
function planeValue(
  frustum: {
    near: number;
    far: number;
    halfX: number;
    halfY: number;
    crop: IAutoMovieDeliveryCropNdc;
  },
  plane: number,
  point: IAutoMovieVector3,
): number {
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
}
