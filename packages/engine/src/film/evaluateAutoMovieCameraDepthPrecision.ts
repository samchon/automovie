import {
  IAutoMovieCameraDepthPrecisionReport,
  type IAutoMovieEvaluateCameraDepthPrecision,
} from "@automovie/interface";

import { overflowsBinary64 } from "../math/internal/overflowsBinary64";

/**
 * Measure the largest gap between adjacent representable depths that a camera's
 * standard perspective depth buffer leaves inside one required camera-space
 * range, and judge it against an authored maximum.
 *
 * With `levels = 2^bits - 1`, a depth `z` lies at `q(z) * levels` in code
 * units, where `q(z) = (1/near - 1/z) / (1/near - 1/far)`, and the code `k`
 * decodes to `1 / (1/near - (k/levels) * (1/near - 1/far))`. The gap between
 * adjacent codes grows with depth, so the widest cell the closed range
 * `[requiredNear, requiredFar]` touches is the one ending at, or containing,
 * `requiredFar`: codes `ceil(q(requiredFar) * levels) - 1` and that ceiling. A
 * range that ends exactly on `near` needs only code 0, which decodes exactly,
 * so it reports codes 0 and 0 and a step of 0.
 *
 * The report echoes every input, and its `status` is `invalid` for a negative
 * or non-finite time, a clip range that is not `0 < near < far` and finite, an
 * inverted or non-finite required range, a bit depth that is not a positive
 * integer whose level count is a safe integer, a maximum step that is not
 * finite and positive, or a step that does not evaluate to a finite
 * non-negative number; `outside-clipping-range` when the required range leaves
 * `[near, far]`; and otherwise `satisfied` when the step is at most the
 * maximum, equality included, else `insufficient-precision`. Only `satisfied`
 * sets `passed`.
 */
export function evaluateAutoMovieCameraDepthPrecision(
  props: IAutoMovieEvaluateCameraDepthPrecision.IProps,
): IAutoMovieCameraDepthPrecisionReport {
  const base: Omit<
    IAutoMovieCameraDepthPrecisionReport,
    "lowerCode" | "upperCode" | "measuredStepMeters" | "status" | "passed"
  > = {
    camera: props.camera,
    time: props.time,
    metric: "maximum-adjacent-depth-step",
    unit: "meters",
    near: props.near,
    far: props.far,
    requiredNear: props.requiredNear,
    requiredFar: props.requiredFar,
    minimumDepthBits: props.constraint.minimumDepthBits,
    maximumStepMeters: props.constraint.maximumStepMeters,
  };
  function unmeasured(
    status: "invalid" | "outside-clipping-range",
  ): IAutoMovieCameraDepthPrecisionReport {
    return {
      ...base,
      lowerCode: null,
      upperCode: null,
      measuredStepMeters: null,
      status,
      passed: false,
    };
  }
  const levels: number = 2 ** props.constraint.minimumDepthBits - 1;
  if (
    // Negated comparisons: an unresolved camera is reported as NaN operands.
    !(props.time >= 0) ||
    !(props.near > 0) ||
    !(props.far > props.near) ||
    !(props.requiredNear <= props.requiredFar) ||
    !(props.constraint.minimumDepthBits > 0) ||
    !(props.constraint.maximumStepMeters > 0) ||
    levels > Number.MAX_SAFE_INTEGER
  )
    return unmeasured("invalid");
  if (props.requiredNear < props.near || props.requiredFar > props.far)
    return unmeasured("outside-clipping-range");
  const reciprocalNear: number = 1 / props.near;
  // A near plane this close to zero has a reciprocal past the largest double.
  if (overflowsBinary64(reciprocalNear)) return unmeasured("invalid");
  const reciprocalSpan: number = reciprocalNear - 1 / props.far;
  const normalized: number =
    (reciprocalNear - 1 / props.requiredFar) / reciprocalSpan;
  const upperCode: number = Math.ceil(
    Math.min(1, Math.max(0, normalized)) * levels,
  );
  const lowerCode: number = Math.max(0, upperCode - 1);
  function depthAtCode(code: number): number {
    return 1 / (reciprocalNear - (code / levels) * reciprocalSpan);
  }
  const upperDepth: number = depthAtCode(upperCode);
  const lowerDepth: number = depthAtCode(lowerCode);
  if (overflowsBinary64(upperDepth) || overflowsBinary64(lowerDepth))
    return unmeasured("invalid");
  const measuredStepMeters: number = upperDepth - lowerDepth;
  if (!(measuredStepMeters >= 0)) return unmeasured("invalid");
  const passed: boolean =
    measuredStepMeters <= props.constraint.maximumStepMeters;
  return {
    ...base,
    lowerCode,
    upperCode,
    measuredStepMeters,
    status: passed ? "satisfied" : "insufficient-precision",
    passed,
  };
}
