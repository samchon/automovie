import { IAutoMovieJointAxes, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieJointAxesIssue } from "./IAutoMovieJointAxesIssue";

type AutoMovieJointAxis = "flexion" | "abduction" | "twist";

const JOINT_AXES: readonly AutoMovieJointAxis[] = [
  "flexion",
  "abduction",
  "twist",
];

const VECTOR_AXES: readonly ["x", "y", "z"] = ["x", "y", "z"];

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
 * Every reason a joint-axis basis cannot serve the clinical angle
 * conversions, as located issues; an empty list means the basis is usable.
 *
 * Each axis must have finite components and a length above `1e-9`; it need not
 * be unit length, because {@link normalizeJointAxes} normalizes after this
 * check. When all three axes have a direction, each pair must be orthogonal
 * within an absolute cosine of `1e-6`, so the clinical angles form a real basis
 * instead of silently skewing forward or inverse kinematics. A declared
 * `twistPlacement` must be `"proximal"` or `"distal"`. Issues are listed in
 * that order, each with a path under `path` such as `<path>.twist.y`.
 *
 * @param axes Basis to check; read, never modified.
 * @param path Diagnostic path prefix naming the caller's input.
 *
 * @evidence contracts/common.md#principled-implementation Checks the conditions an orthonormal basis needs, finite and non-degenerate axes and pairwise zero cosines, computing each cosine from unit copies so the threshold is scale-free; orthogonality is checked only when every axis has a direction, since a cosine with a zero or non-finite axis is undefined.
 * @evidence contracts/common.md#clear-and-simple-design Returns issues rather than throwing, so retargeting reports them as violations while `normalizeJointAxes` turns the first into an error; both read one rule set.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every basis meets the same thresholds; nothing is repaired, orthogonalized or defaulted, and no bone is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States each requirement with its threshold, that non-unit axes are accepted and why, when orthogonality is checked, the issue order and path shape, and that an empty list means usable.
 * @evidence contracts/performance.md#efficient-algorithms Constant work: nine finiteness checks, three lengths and, when usable, three normalizations and three dot products.
 * @evidence contracts/performance.md#reuse-equivalent-work Unit copies of the three admitted axes serve all three pairwise dot checks inside the call; issues are rebuilt for the current values and diagnostic path.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned issues.
 * @author Samchon
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
    let finite: boolean = true;
    for (const vectorAxis of VECTOR_AXES) {
      const value: number = axes[jointAxis][vectorAxis];
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

  return issues;
};
