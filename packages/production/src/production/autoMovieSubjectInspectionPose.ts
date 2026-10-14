import { IAutoMovieSubjectBox, IAutoMovieSubjectReviewViewpoint, IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieSubjectInspectionPose } from "./IAutoMovieSubjectInspectionPose";
import { subjectInspectionBoxCenter } from "./subjectInspectionBoxCenter";
import { subjectInspectionBoxRadius } from "./subjectInspectionBoxRadius";

/**
 * Resolve a planned viewpoint into a camera position, target and clip planes in its stated coordinate space.
 *
 * @evidence contracts/common.md#principled-implementation Box centre plus direction times distance places the eye; the floored half-diagonal sets positive near and surrounding far planes.
 * @evidence contracts/common.md#clear-and-simple-design This pose resolver shares centre/radius arithmetic with fitting and keeps model/world basis explicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 0.5-m radius floor breaks exact scale proportionality for small boxes; supplied viewpoint/lens premises are not revalidated and no depth-buffer or visual outcome is certified.
 * @evidence contracts/common.md#meaningful-documentation Position/target/clip values use metres; FOV degrees and aspect are copied from the current request.
 * @evidence contracts/performance.md#efficient-algorithms Fixed box/vector arithmetic produces one pose without mesh traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work The already planned direction/distance are reused instead of another turntable rule calculation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh pose/position/target records, with no retained geometry or camera handle.
 */
export function autoMovieSubjectInspectionPose(
  props: {
  /** Box the viewpoint frames, in the subject's own coordinate space. */
  bounds: IAutoMovieSubjectBox;

  /** Coordinate basis the box, and therefore the pose, is stated in. */
  coordinateSpace: "model" | "world";

  /** Plan entry being resolved. */
  viewpoint: IAutoMovieSubjectReviewViewpoint;

  /** Vertical field of view in degrees. */
  fovDeg: number;

  /** Viewport width divided by height. */
  aspect: number;
}
): IAutoMovieSubjectInspectionPose {
  const center: IAutoMovieVector3 = subjectInspectionBoxCenter(props.bounds);
  const radius: number = subjectInspectionBoxRadius(props.bounds);
  const distance: number = props.viewpoint.distance;
  return {
    coordinateSpace: props.coordinateSpace,
    position: {
      x: center.x + props.viewpoint.direction.x * distance,
      y: center.y + props.viewpoint.direction.y * distance,
      z: center.z + props.viewpoint.direction.z * distance,
    },
    target: center,
    fovDeg: props.fovDeg,
    aspect: props.aspect,
    // Half the gap to the subject's near side, floored off zero so a distance
    // factor of exactly one still leaves a positive near plane.
    near: Math.max((distance - radius) / 2, radius / 1000),
    // Five radii past the subject's far side, so the eye keeps enough of the
    // surroundings to tell where the subject stands.
    far: distance + radius * 5,
  };
}
