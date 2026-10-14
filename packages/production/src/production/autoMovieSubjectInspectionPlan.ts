import { IAutoMovieSubjectBox, IAutoMovieSubjectReviewViewpoint } from "@automovie/interface";
import { subjectInspectionSubjectFitDistance } from "./subjectInspectionSubjectFitDistance";
import { subjectInspectionSubjectViewDirection } from "./subjectInspectionSubjectViewDirection";
import { subjectInspectionDegreeLabel } from "./subjectInspectionDegreeLabel";

/**
 * Build ordered azimuth/elevation viewpoints from one subject box and lens rule.
 *
 * @evidence contracts/common.md#principled-implementation A bounded Cartesian ring uses trigonometric directions and a sphere-fitting distance under the narrower lens field.
 * @evidence contracts/common.md#clear-and-simple-design Distance, direction and whole-degree labels have separate owners and the service handles grounding as a later plan operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate rounded ids refuse; the radius has a 0.5-m floor even for small nondegenerate boxes, and finite bounds/FOV remain caller premises beyond current checks.
 * @evidence contracts/common.md#meaningful-documentation Angles use degrees, distance metres, and at most 64 azimuths times eight rings are emitted; these viewpoints do not prove actual visible coverage.
 * @evidence contracts/performance.md#efficient-algorithms Work/storage are proportional to azimuths times rings, plus constant lens fitting and id membership.
 * @evidence contracts/performance.md#reuse-equivalent-work One fit distance is reused across all ring entries; independent calls rebuild the plan for their actual raster/aspect.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh viewpoint/vector records and temporary taken-id set leaves the call.
 */
export function autoMovieSubjectInspectionPlan(
  props: {
  /** Box the plan frames, in the subject's own coordinate space. */
  bounds: IAutoMovieSubjectBox;

  /** Evenly spaced azimuths per elevation ring, at least one. */
  azimuthCount: number;

  /** Elevation rings in degrees, in the order they are walked. */
  elevationsDeg: readonly number[];

  /** Positive multiplier on the distance fitting the selected bounds' floored sphere. */
  distanceFactor: number;

  /** Vertical field of view in degrees, inside `(0, 180)`. */
  fovDeg: number;

  /** Positive viewport width divided by height. */
  aspect: number;
}
): IAutoMovieSubjectReviewViewpoint[] {
  if (
    Number.isInteger(props.azimuthCount) === false ||
    props.azimuthCount < 1 ||
    props.azimuthCount > 64
  )
    throw new RangeError(
      `Inspection azimuth count must be an integer from 1 through 64, not ${props.azimuthCount}.`,
    );
  if (props.elevationsDeg.length === 0 || props.elevationsDeg.length > 8)
    throw new RangeError(
      "Inspection plan needs from one through eight elevation rings.",
    );
  if (
    props.elevationsDeg.some(
      (elevation: number) : boolean =>
        Number.isFinite(elevation) === false ||
        elevation < -85 ||
        elevation > 85,
    )
  )
    throw new RangeError(
      "Every inspection elevation must be a finite angle within [-85, 85] degrees.",
    );
  if (
    Number.isFinite(props.distanceFactor) === false ||
    props.distanceFactor <= 0
  )
    throw new RangeError(
      `Inspection distance factor must be finite and positive, not ${props.distanceFactor}.`,
    );
  const distance: number = subjectInspectionSubjectFitDistance(props);
  const viewpoints: IAutoMovieSubjectReviewViewpoint[] = [];
  const taken: Set<string> = new Set<string>();
  for (const elevationDeg of props.elevationsDeg)
    for (let index: number = 0; index < props.azimuthCount; index++) {
      const azimuthDeg: number = (360 / props.azimuthCount) * index;
      const id: string = `az${subjectInspectionDegreeLabel(azimuthDeg)}-el${subjectInspectionDegreeLabel(elevationDeg)}`;
      // Two rings rounding to one label would give one plan two viewpoints
      // under one name, and coverage could then never say which was observed.
      if (taken.has(id))
        throw new RangeError(
          `Inspection plan produces viewpoint id "${id}" twice; separate its elevation rings by at least one degree.`,
        );
      taken.add(id);
      viewpoints.push({
        id,
        direction: subjectInspectionSubjectViewDirection(azimuthDeg, elevationDeg),
        distance,
        projection: "perspective",
        pose: null,
        state: null,
      });
    }
  return viewpoints;
}
