import { IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieJointAxes } from "./IAutoMovieJointAxes";
import { validateJointAxesBasis } from "./validateJointAxesBasis";

/**
 * Validate and normalize a joint-axis basis for quaternion math.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Converts an accepted control basis into stable unit axes without changing their semantic identity.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Prepares the declared basis for deterministic control evaluation.
 * @author Samchon
 */
export const normalizeJointAxes = (
  axes: IAutoMovieJointAxes,
  path: string,
): IAutoMovieJointAxes => {
  const issues = validateJointAxesBasis(axes, path);
  if (issues.length !== 0) {
    const issue = issues[0]!;
    throw new Error(`${issue.path} ${issue.expected}`);
  }
  return normalizeRawJointAxes(axes);
};

const normalizeRawJointAxes = (
  axes: IAutoMovieJointAxes,
): IAutoMovieJointAxes => ({
  flexion: normalizeAxis(axes.flexion),
  abduction: normalizeAxis(axes.abduction),
  twist: normalizeAxis(axes.twist),
});

const normalizeAxis = (axis: IAutoMovieVector3): IAutoMovieVector3 =>
  Vector3.scale(axis, 1 / Vector3.length(axis));

const normalizeAxis = (axis: IAutoMovieVector3): IAutoMovieVector3 =>
  Vector3.scale(axis, 1 / Vector3.length(axis));
