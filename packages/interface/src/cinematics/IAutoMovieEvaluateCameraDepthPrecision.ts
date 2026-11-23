import type { IAutoMovieCameraDepthPrecisionConstraint } from "../scene/IAutoMovieCameraDepthPrecisionConstraint";

/**
 * Data and callback contracts shared by the EvaluateCameraDepthPrecision
 * operations.
 */
export namespace IAutoMovieEvaluateCameraDepthPrecision {
  /**
   * Measure the largest gap between adjacent representable depths that a
   * camera's standard perspective depth buffer leaves inside one required
   * camera-space range, and judge it against an authored maximum.
   *
   * With `levels = 2^bits - 1`, a depth `z` lies at `q(z) * levels` in code
   * units, where `q(z) = (1/near - 1/z) / (1/near - 1/far)`, and the code `k`
   * decodes to `1 / (1/near - (k/levels) * (1/near - 1/far))`. The gap between
   * adjacent codes grows with depth, so the widest cell the closed range
   * `[requiredNear, requiredFar]` touches is the one ending at, or containing,
   * `requiredFar`: codes `ceil(q(requiredFar) * levels) - 1` and that ceiling.
   * A range that ends exactly on `near` needs only code 0, which decodes
   * exactly, so it reports codes 0 and 0 and a step of 0.
   *
   * The report echoes every input, with a non-finite number as null, and its
   * `status` is `invalid` for a blank camera, a negative or non-finite time, a
   * clip range that is not `0 < near < far` and finite, an inverted or
   * non-finite required range, a bit depth that is not a positive integer whose
   * level count is a safe integer, a maximum step that is not finite and
   * positive, or a step that does not evaluate to a finite non-negative number;
   * `outside-clipping-range` when the required range leaves `[near, far]`; and
   * otherwise `satisfied` when the step is at most the maximum, equality
   * included, else `insufficient-precision`. Only `satisfied` sets `passed`.
   */
  export type IProps = {
    /** Stable scene camera identity, non-blank. */
    camera: string;

    /** Shot-local sample time in seconds, finite and non-negative. */
    time: number;

    /** Near clip distance in metres, finite and positive. */
    near: number;

    /** Far clip distance in metres, finite and beyond `near`. */
    far: number;

    /** Nearest camera-space depth the shot needs resolved, in metres. */
    requiredNear: number;

    /** Farthest camera-space depth the shot needs resolved, in metres. */
    requiredFar: number;

    /** Authored depth-buffer bits and largest allowed adjacent step. */
    constraint: IAutoMovieCameraDepthPrecisionConstraint;
  };
}
