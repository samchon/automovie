import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieJointAxes } from "./IAutoMovieJointAxes";
import { validateJointAxesBasis } from "./validateJointAxesBasis";

/**
 * Validate and normalize a joint-axis basis for quaternion math.
 *
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
  ...(axes.twistPlacement === undefined
    ? {}
    : { twistPlacement: axes.twistPlacement }),
});

const normalizeAxis = (axis: IAutoMovieVector3): IAutoMovieVector3 =>
  Vector3.scale(axis, 1 / Vector3.length(axis));
