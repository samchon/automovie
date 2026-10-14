import { Vector3 } from "../math/Vector3";
import { IAutoMovieJointAxes } from "./IAutoMovieJointAxes";
import { IAutoMovieJointAxesIssue } from "./IAutoMovieJointAxesIssue";
import { validateJointAxesBasis } from "./validateJointAxesBasis";

/**
 * Validate a joint-axis basis and return it with unit-length axes, ready for
 * quaternion composition and decomposition.
 *
 * The axes must pass {@link validateJointAxesBasis}: finite, non-zero and
 * mutually orthogonal, with a known `twistPlacement`. Otherwise the first issue
 * is thrown as `<path> <expected>`, such as
 * `jointToQuaternion axes.twist must have non-zero length`. The result is a new
 * object; `twistPlacement` is copied only when the input declares it.
 *
 * @param axes Basis to check; read, never modified.
 * @param path Diagnostic path prefix naming the caller's input.
 *
 * @evidence contracts/common.md#principled-implementation Normalizing each axis by its length turns a validated orthogonal basis into an orthonormal one, the premise every Euler composition and extraction in this module relies on; `Vector3.normalize` rescales extreme components before measuring, so axes that pass the non-zero check never divide by an underflowed length.
 * @evidence contracts/common.md#clear-and-simple-design Turns the issue list of `validateJointAxesBasis`, which retargeting reports as violations, into the throwing guard the quaternion functions need, so the basis rules live in one place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A skewed or degenerate basis throws instead of being orthogonalized or replaced by the default, and no bone or caller is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the accepted basis, the thrown message shape with an example, that the result is new with unit axes, and when `twistPlacement` is copied.
 * @evidence contracts/performance.md#efficient-algorithms Constant work: one validation of three axes and three normalizations, allocating the returned basis only.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each requested basis is validated before normalization, and mutable authored axis records have no shared validated identity across conversions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned basis.
 * @author Samchon
 */
export const normalizeJointAxes: (
  axes: IAutoMovieJointAxes,
  path: string,
) => IAutoMovieJointAxes = (
  axes: IAutoMovieJointAxes,
  path: string,
): IAutoMovieJointAxes => {
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
  };
};
