import type {
  IAutoMovieJointAxes,
  IAutoMovieJointAxesIssue,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { validateJointAxesBasis } from "./validateJointAxesBasis";

/*
 * Validate a joint-axis basis and return it with unit-length axes, ready for
 * quaternion composition and decomposition.
 *
 * The axes must pass validateJointAxesBasis: non-zero and mutually
 * orthogonal, with a supported rotation order and compatible twist placement.
 * Otherwise the first issue is thrown as `<path> <expected>`, such as
 * `jointToQuaternion axes.twist must have non-zero length`. The result has unit
 * axes and any declared placement and rotation order; a rig prepares it once
 * and passes the basis to its per-pose readers.
 * Parameter axes: Basis to check; read, never modified.
 * Parameter path: Diagnostic path prefix naming the caller's input.
 */
export function normalizeJointAxes(
  axes: IAutoMovieJointAxes,
  path: string,
): IAutoMovieJointAxes {
  const issues: IAutoMovieJointAxesIssue[] = validateJointAxesBasis(axes, path);
  if (issues.length !== 0) {
    const issue: IAutoMovieJointAxesIssue = issues[0]!;
    throw new Error(`${issue.path} ${issue.expected}`);
  }
  return {
    flexion: Vector3.normalize(axes.flexion),
    abduction: Vector3.normalize(axes.abduction),
    twist: Vector3.normalize(axes.twist),
    ...(axes.twistPlacement === undefined
      ? {}
      : { twistPlacement: axes.twistPlacement }),
    ...(axes.rotationOrder === undefined
      ? {}
      : { rotationOrder: axes.rotationOrder }),
  };
}