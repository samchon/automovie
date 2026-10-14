import { IAutoMovieSubjectBox } from "@automovie/interface";
import { subjectInspectionBoxRadius } from "./subjectInspectionBoxRadius";

/**
 * Fit the floored box sphere to the narrower vertical or horizontal field of view.
 *
 * @evidence contracts/common.md#principled-implementation Horizontal half-FOV derives from vertical half-FOV/aspect, and radius divided by sine of the narrower angle is multiplied by the caller factor.
 * @evidence contracts/common.md#clear-and-simple-design This owner keeps operation association aligned with the independently maintained viewer framing rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current range comparisons do not reject NaN FOV; finite bounds/FOV and a valid factor remain caller premises beyond the explicit aspect check.
 * @evidence contracts/common.md#meaningful-documentation FOV uses degrees, output metres, and factors below one intentionally request tighter framing rather than guaranteed full-box visibility.
 * @evidence contracts/performance.md#efficient-algorithms Fixed trigonometric/box operations determine cost, without mesh traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared box radius supplies both fitting and later clip construction instead of another radius estimate.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the scalar distance escapes and no lens, geometry or viewport handle is retained.
 */
export function subjectInspectionSubjectFitDistance(
  props: {
  bounds: IAutoMovieSubjectBox;
  distanceFactor: number;
  fovDeg: number;
  aspect: number;
}
): number {
  if (props.fovDeg <= 0 || props.fovDeg >= 180)
    throw new RangeError(
      `Inspection lens field of view must be within (0, 180) degrees, not ${props.fovDeg}.`,
    );
  if (Number.isFinite(props.aspect) === false || props.aspect <= 0)
    throw new RangeError(
      `Inspection lens aspect must be finite and positive, not ${props.aspect}.`,
    );
  // Preserve the viewer harness's operation association for arithmetic parity.
  const verticalHalf: number = (props.fovDeg * (Math.PI / 180)) / 2;
  const horizontalHalf: number = Math.atan(Math.tan(verticalHalf) * props.aspect);
  return (
    (subjectInspectionBoxRadius(props.bounds) /
      Math.sin(Math.min(verticalHalf, horizontalHalf))) *
    props.distanceFactor
  );
}
