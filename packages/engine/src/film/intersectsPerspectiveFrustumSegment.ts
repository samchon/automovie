import {
  type IAutoMovieIntersectsPerspectiveFrustumSegment,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { deliveryCropNdc } from "./deliveryCropNdc";
import { localSegmentMeetsPerspectiveFrustum } from "./localSegmentMeetsPerspectiveFrustum";

/**
 * Whether a world-space segment intersects a perspective-camera frustum.
 *
 * The frustum is the intersection of six half-spaces, so it is convex and the
 * segment is clipped against them one plane at a time in its own parameter.
 * Each plane is linear in camera-local coordinates, which gives algebraic
 * crossings rather than chosen samples. This is why the helper exists: a close
 * shot frames the band between roughly 0.71 and 0.99 of a subject's height, so
 * neither end of the subject is on screen while its middle fills the frame.
 * Testing chosen points, the base, the top or the midpoint, reports such a
 * subject absent; clipping finds it. Touching a face counts as meeting it, and
 * a malformed crop throws the `RangeError` of {@link deliveryCropNdc}.
 *
 * @param props.camera Camera placement, looking down its local −Z.
 * @param props.from Segment start in world metres.
 * @param props.to Segment end in world metres.
 * @param props.near Near clip depth in metres.
 * @param props.far Far clip depth in metres.
 * @param props.halfY Vertical half-field tangent, `tan(fovY / 2)`.
 * @param props.aspect Frame width over height.
 * @param props.crop Delivery crop, or the whole gate when omitted.
 * @returns True when some point of the segment lies inside or on the frustum.
 */
export function intersectsPerspectiveFrustumSegment(
  props: IAutoMovieIntersectsPerspectiveFrustumSegment.IProps,
): boolean {
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(
    props.camera.rotation,
  );
  function local(point: IAutoMovieVector3): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      inverse,
      Vector3.subtract(point, props.camera.position),
    );
  }
  return localSegmentMeetsPerspectiveFrustum({
    from: local(props.from),
    to: local(props.to),
    near: props.near,
    far: props.far,
    halfX: props.halfY * props.aspect,
    halfY: props.halfY,
    crop: deliveryCropNdc(props.crop),
  });
}
