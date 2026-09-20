import { IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieJointAxes } from "./IAutoMovieJointAxes";
import { IAutoMovieJointAxesIssue } from "./IAutoMovieJointAxesIssue";

const JOINT_AXES = ["flexion", "abduction", "twist"] as const;

const VECTOR_AXES = ["x", "y", "z"] as const;

const MIN_AXIS_LENGTH = 1e-9;

const MAX_AXIS_DOT = 1e-6;

type AutoMovieJointAxis = (typeof JOINT_AXES)[number];

/**
 * Validate the axis basis used by joint compose/decompose.
 *
 * Axes may be non-unit; callers normalize after this check. They must be
 * finite, non-zero, and mutually orthogonal so clinical angles form a real
 * basis instead of silently skewing FK/IK.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-invalid-rig-refusal Refuses any control-axis set that cannot form a finite orthogonal articulation basis.
 * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-output-failures Produces field-located failures for malformed rig bases.
 * @author Samchon
 */
export const validateJointAxesBasis = (
  axes: IAutoMovieJointAxes,
  path: string,
): IAutoMovieJointAxesIssue[] => {
  const issues: IAutoMovieJointAxesIssue[] = [];
  const usable = new Set<AutoMovieJointAxis>();

  for (const jointAxis of JOINT_AXES) {
    let finite = true;
    for (const vectorAxis of VECTOR_AXES) {
      const value = axes[jointAxis][vectorAxis];
      if (!Number.isFinite(value)) {
        finite = false;
        issues.push({
          path: `${path}.${jointAxis}.${vectorAxis}`,
          expected: `must be finite, but was ${value}`,
          value,
        });
      }
    }
    if (!finite) continue;
    const length = Vector3.length(axes[jointAxis]);
    if (length <= MIN_AXIS_LENGTH)
      issues.push({
        path: `${path}.${jointAxis}`,
        expected: "must have non-zero length",
        value: axes[jointAxis],
      });
    else usable.add(jointAxis);
  }

  if (JOINT_AXES.every((axis) => usable.has(axis))) {
    const normalized = normalizeRawJointAxes(axes);
    for (const [a, b] of [
      ["flexion", "abduction"],
      ["flexion", "twist"],
      ["abduction", "twist"],
    ] as const) {
      const dot = Math.abs(Vector3.dot(normalized[a], normalized[b]));
      if (dot > MAX_AXIS_DOT)
        issues.push({
          path: `${path}.${b}`,
          expected: `${a} and ${b} axes must be orthogonal`,
          value: { [a]: axes[a], [b]: axes[b] },
        });
    }
  }

  return issues;
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
