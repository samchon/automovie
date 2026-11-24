import {
  IAutoMovieJointAxes,
  type IAutoMovieJointAxesIssue,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

type AutoMovieJointAxis = "flexion" | "abduction" | "twist";

const JOINT_AXES: readonly AutoMovieJointAxis[] = [
  "flexion",
  "abduction",
  "twist",
];

/** Length at or below which an axis names no direction. */
const MIN_AXIS_LENGTH: number = 1e-9;

/** Largest absolute cosine two axes may have and still count as orthogonal. */
const MAX_AXIS_DOT: number = 1e-6;

/** The axis pairs whose orthogonality is checked, reported on the second. */
const AXIS_PAIRS: readonly (readonly [
  AutoMovieJointAxis,
  AutoMovieJointAxis,
])[] = [
  ["flexion", "abduction"],
  ["flexion", "twist"],
  ["abduction", "twist"],
];

/**
 * Every reason a joint-axis basis cannot serve the clinical angle conversions,
 * as located issues; an empty list means the basis is usable.
 *
 * Each axis must have finite components and a length above `1e-9`; it need not
 * be unit length, because {@link normalizeJointAxes} normalizes after this
 * check. When all three axes have a direction, each pair must be orthogonal
 * within an absolute cosine of `1e-6`, so the clinical angles form a real basis
 * instead of silently skewing forward or inverse kinematics. A declared
 * `twistPlacement` must be `"proximal"` or `"distal"`. The only explicit
 * `rotationOrder` is `"flexion-abduction-twist"`, which permits omitted or
 * distal twist placement. Issues are listed in that order, each with a path
 * under `path` such as `<path>.twist.y`.
 *
 * @param axes Basis to check; read, never modified.
 * @param path Diagnostic path prefix naming the caller's input.
 */
export const validateJointAxesBasis: (
  axes: IAutoMovieJointAxes,
  path: string,
) => IAutoMovieJointAxesIssue[] = (
  axes: IAutoMovieJointAxes,
  path: string,
): IAutoMovieJointAxesIssue[] => {
  const issues: IAutoMovieJointAxesIssue[] = [];
  const usable: Set<AutoMovieJointAxis> = new Set();

  for (const jointAxis of JOINT_AXES) {
    const length: number = Vector3.length(axes[jointAxis]);
    if (length <= MIN_AXIS_LENGTH)
      issues.push({
        path: `${path}.${jointAxis}`,
        expected: "must have non-zero length",
        value: axes[jointAxis],
      });
    else usable.add(jointAxis);
  }

  if (usable.size === JOINT_AXES.length) {
    const unit: Record<AutoMovieJointAxis, IAutoMovieVector3> = {
      flexion: Vector3.normalize(axes.flexion),
      abduction: Vector3.normalize(axes.abduction),
      twist: Vector3.normalize(axes.twist),
    };
    for (const [a, b] of AXIS_PAIRS)
      if (Math.abs(Vector3.dot(unit[a], unit[b])) > MAX_AXIS_DOT)
        issues.push({
          path: `${path}.${b}`,
          expected: `${a} and ${b} axes must be orthogonal`,
          value: { [a]: axes[a], [b]: axes[b] },
        });
  }

  if (
    axes.twistPlacement !== undefined &&
    axes.twistPlacement !== "proximal" &&
    axes.twistPlacement !== "distal"
  )
    issues.push({
      path: `${path}.twistPlacement`,
      expected: `must be "proximal" or "distal", but was ${String(axes.twistPlacement)}`,
      value: axes.twistPlacement,
    });

  if (
    axes.rotationOrder !== undefined &&
    axes.rotationOrder !== "flexion-abduction-twist"
  )
    issues.push({
      path: `${path}.rotationOrder`,
      expected: `must be "flexion-abduction-twist", but was ${String(axes.rotationOrder)}`,
      value: axes.rotationOrder,
    });
  else if (
    axes.rotationOrder === "flexion-abduction-twist" &&
    axes.twistPlacement === "proximal"
  )
    issues.push({
      path: `${path}.twistPlacement`,
      expected: 'must be "distal" or omitted for flexion-abduction-twist',
      value: axes.twistPlacement,
    });

  return issues;
};
