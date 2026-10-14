import {
  IAutoMovieDeliveryCrop,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";
import { deliveryCropNdc } from "./deliveryCropNdc";
import { localSegmentMeetsPerspectiveFrustum } from "./localSegmentMeetsPerspectiveFrustum";

/**
 * Whether a world-space segment intersects a perspective-camera frustum.
 *
 * The frustum is the intersection of six half-spaces, so it is convex and the segment is clipped against them one plane at a time in its own parameter. Each plane is linear in camera-local coordinates, which gives algebraic crossings rather than chosen samples. This is why the helper exists: a close shot frames the band between roughly 0.71 and 0.99 of a subject's height, so neither end of the subject is on screen while its middle fills the frame. Testing chosen points, the base, the top or the midpoint, reports such a subject absent; clipping finds it. Touching a face counts as meeting it, and a malformed crop throws the `RangeError` of {@link deliveryCropNdc}.
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
 *
 * @evidence contracts/common.md#principled-implementation The segment's ends are brought into the camera frame by the inverse rotation about the lens, then clipped by Cyrus-Beck against the six planes in `localSegmentMeetsPerspectiveFrustum`; finite endpoints, a valid lens, nearly unit camera rotation and representable intermediates are premises. Binary64 boundary rounding remains and this is not a rendered-pixel proof.
 * @evidence contracts/common.md#clear-and-simple-design The world-to-camera transform and the crop conversion are the only steps here; the clipping core and the crop conversion are shared with the box test and the projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No point of the segment is sampled and no tolerance widens a plane; the same algebraic six-plane criterion applies to every segment, subject to the stated floating arithmetic premises.
 * @evidence contracts/common.md#meaningful-documentation States why clipping replaces point tests, with the close-shot band that motivates it, that boundary contact counts, the crop error, and each parameter's frame and units.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one quaternion inverse, two rotations, one crop conversion and six plane updates.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate over one segment and one camera that coordinates no work across calls; the box test reuses the clipping core directly rather than calling this per edge.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The two camera-local endpoints and the NDC crop live only for the call; nothing outlives it.
 */
export function intersectsPerspectiveFrustumSegment(props: {
  camera: IAutoMovieResolvedCamera;
  from: IAutoMovieVector3;
  to: IAutoMovieVector3;
  near: number;
  far: number;
  halfY: number;
  aspect: number;
  crop?: IAutoMovieDeliveryCrop;
}): boolean {
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
